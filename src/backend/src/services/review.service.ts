import { Injectable, NotFoundException, ForbiddenException, Inject, CACHE_MANAGER } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { Review } from '../models/Review';
import { ReviewResponse } from '../models/ReviewResponse';
import { ReviewStats } from '../types/review';
import { User } from '../models/User';
import { NotificationService } from './notification.service';
import { ImageService } from './image.service';
import { EscortProfile } from '../models/EscortProfile';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(ReviewResponse)
    private reviewResponseRepository: Repository<ReviewResponse>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(EscortProfile)
    private escortProfileRepository: Repository<EscortProfile>,
    private notificationService: NotificationService,
    private imageService: ImageService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}
    const [user, escort] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.escortProfileRepository.findOne({
        where: { id: data.escortId }
      })
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!escort) {
      throw new NotFoundException('Escort not found');
    }

    // Validate booking exists and is completed
    // TODO: Add booking validation logic
    
    const photos = data.photos 
      ? await this.imageService.uploadMultiple(data.photos)
      : [];

    const review = this.reviewRepository.create({
      ...data,
      clientId: userId,
      isVerified: false,
      isPublic: data.isPublic ?? true,
      photos,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Fire and forget notification
    this.notificationService.create({
      userId: escort.userId,
      title: 'New Review',
      message: `You received a new review from ${user.username}`,
      type: 'review',
      data: { reviewId: savedReview.id }
    }).catch(error => {
      // Log notification error but don't fail the review creation
      console.error('Failed to send review notification:', error);
    });

    return savedReview;
  }

  async getReview(id: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['responses'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async updateReview(userId: string, reviewId: string, data: Partial<Review>) {
    const review = await this.getReview(reviewId);

    if (review.clientId !== userId) {
      throw new ForbiddenException('Not authorized to update this review');
    }

    Object.assign(review, data);
    return this.reviewRepository.save(review);
  }

  async deleteReview(userId: string, reviewId: string) {
    const review = await this.getReview(reviewId);

    if (review.clientId !== userId) {
      throw new ForbiddenException('Not authorized to delete this review');
    }

    await this.reviewRepository.remove(review);
  }

  async respondToReview(escortId: string, reviewId: string, content: string) {
    const review = await this.getReview(reviewId);

    if (review.escortId !== escortId) {
      throw new ForbiddenException('Not authorized to respond to this review');
    }

    const response = this.reviewResponseRepository.create({
      reviewId,
      escortId,
      content,
    });

    const savedResponse = await this.reviewResponseRepository.save(response);

    // Send notification to client
    await this.notificationService.create({
      userId: review.clientId,
      title: 'Review Response',
      message: 'Your review received a response',
      type: 'review_response',
      data: { reviewId, responseId: savedResponse.id }
    });

    return savedResponse;
  }

  async getEscortReviews(escortId: string, {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    order = 'DESC',
    filter = 'all',
  } = {}) {
    // Validiere sortBy um SQL-Injection zu verhindern
    const allowedSortFields = ['createdAt', 'rating', 'updatedAt'];
    if (!allowedSortFields.includes(sortBy)) {
      sortBy = 'createdAt';
    }

    const query = this.reviewRepository.createQueryBuilder('review')
      .where('review.escortId = :escortId', { escortId })
      .andWhere('review.isPublic = :isPublic', { isPublic: true })
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.responses', 'responses')
      .cache(true, `escort_reviews:${escortId}:${page}:${limit}:${sortBy}:${order}:${filter}`, 60000); // 1 minute cache

    if (filter === 'verified') {
      query.andWhere('review.isVerified = :isVerified', { isVerified: true });
    }

    const [reviews, total] = await query
      .orderBy(`review.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: reviews,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async getReviewStats(escortId: string): Promise<ReviewStats> {
    // Cache-Key für Redis
    const cacheKey = `review_stats:${escortId}`;
    
    // Try to get from cache first
    const cachedStats = await this.cacheManager.get<ReviewStats>(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }

    const reviews = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.escortId = :escortId', { escortId })
      .andWhere('review.isPublic = :isPublic', { isPublic: true })
      .cache(true, `review_query:${escortId}`, 30000) // 30 seconds cache
      .getMany();

    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      const emptyStats: ReviewStats = {
        totalReviews: 0,
        averageRating: {
          overall: 0,
          accuracy: 0,
          communication: 0,
          cleanliness: 0,
          location: 0,
          value: 0,
        },
        verifiedReviews: 0,
        recommendationRate: 0,
        ratingDistribution: {
          5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        },
      };
      
      // Cache empty stats for 5 minutes
      await this.cacheManager.set(cacheKey, emptyStats, 300000);
      return emptyStats;
    }

    // Optimierte Berechnungen mit einer Schleife
    const ratingTotals = {
      overall: 0,
      accuracy: 0,
      communication: 0,
      cleanliness: 0,
      location: 0,
      value: 0,
    };
    let verifiedCount = 0;
    let recommendedCount = 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const review of reviews) {
      // Rating-Summen
      ratingTotals.overall += review.rating.overall;
      ratingTotals.accuracy += review.rating.accuracy;
      ratingTotals.communication += review.rating.communication;
      ratingTotals.cleanliness += review.rating.cleanliness;
      ratingTotals.location += review.rating.location;
      ratingTotals.value += review.rating.value;

      // Verifizierte und empfohlene Reviews
      if (review.isVerified) verifiedCount++;
      if (review.rating.overall >= 4) recommendedCount++;

      // Rating-Verteilung
      const rating = Math.round(review.rating.overall);
      distribution[rating]++;
    }

    const stats: ReviewStats = {
      totalReviews,
      averageRating: {
        overall: ratingTotals.overall / totalReviews,
        accuracy: ratingTotals.accuracy / totalReviews,
        communication: ratingTotals.communication / totalReviews,
        cleanliness: ratingTotals.cleanliness / totalReviews,
        location: ratingTotals.location / totalReviews,
        value: ratingTotals.value / totalReviews,
      },
      verifiedReviews: verifiedCount,
      recommendationRate: (recommendedCount / totalReviews) * 100,
      ratingDistribution: distribution,
    };

    // Cache stats for 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300000);
    return stats;
  }

  private calculateAverage(numbers: number[]): number {
    return numbers.length === 0 ? 0 : numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }