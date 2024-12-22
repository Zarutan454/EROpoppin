import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../models/Review';
import { ReviewResponse } from '../models/ReviewResponse';
import { ReviewStats, ReviewRating } from '../types/review';
import { NotificationService } from './notifications';
import { ApiError } from '../utils/ApiError';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(ReviewResponse)
    private reviewResponseRepository: Repository<ReviewResponse>,
    private notificationService: NotificationService,
  ) {}

  async createReview(review: Partial<Review>): Promise<Review> {
    // Validate booking
    const booking = await this.validateBooking(review.bookingId, review.clientId);
    if (!booking) {
      throw new ApiError('Invalid booking or not completed', 'validation', 400);
    }

    // Check for existing review
    const existingReview = await this.reviewRepository.findOne({
      where: { bookingId: review.bookingId }
    });
    if (existingReview) {
      throw new ApiError('Review already exists for this booking', 'validation', 400);
    }

    const newReview = this.reviewRepository.create({
      ...review,
      isVerified: !!booking,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedReview = await this.reviewRepository.save(newReview);

    // Notify escort about new review
    await this.notificationService.send({
      user_id: review.escortId,
      title: 'New Review',
      message: 'You have received a new review',
      type: 'review',
      data: { reviewId: savedReview.id }
    });

    return savedReview;
  }

  async getReviewStats(escortId: string): Promise<ReviewStats> {
    const reviews = await this.reviewRepository.find({
      where: { escortId, isPublic: true }
    });

    const totalReviews = reviews.length;
    const verifiedReviews = reviews.filter(r => r.isVerified).length;
    const totalPhotos = reviews.reduce((sum, r) => sum + (r.photos?.length || 0), 0);

    const averageRating = this.calculateAverageRating(reviews);
    const recommendationRate = (reviews.filter(r => r.recommend).length / totalReviews) * 100;

    const ratingDistribution = reviews.reduce((dist, review) => {
      const rating = Math.round(this.calculateOverallRating(review.rating));
      dist[rating] = (dist[rating] || 0) + 1;
      return dist;
    }, {} as Record<number, number>);

    return {
      totalReviews,
      averageRating,
      verifiedReviews,
      totalPhotos,
      recommendationRate,
      ratingDistribution,
    };
  }

  async respondToReview(reviewId: string, escortId: string, content: string): Promise<ReviewResponse> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, escortId }
    });

    if (!review) {
      throw new ApiError('Review not found', 'validation', 404);
    }

    const existingResponse = await this.reviewResponseRepository.findOne({
      where: { reviewId }
    });

    if (existingResponse) {
      throw new ApiError('Response already exists', 'validation', 400);
    }

    const response = this.reviewResponseRepository.create({
      reviewId,
      escortId,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.reviewResponseRepository.save(response);
  }

  private calculateOverallRating(rating: ReviewRating): number {
    return (
      rating.communication +
      rating.appearance +
      rating.service +
      rating.location +
      rating.value
    ) / 5;
  }

  private calculateAverageRating(reviews: Review[]): ReviewRating {
    if (reviews.length === 0) {
      return {
        communication: 0,
        appearance: 0,
        service: 0,
        location: 0,
        value: 0,
      };
    }

    const sum = reviews.reduce(
      (acc, review) => ({
        communication: acc.communication + review.rating.communication,
        appearance: acc.appearance + review.rating.appearance,
        service: acc.service + review.rating.service,
        location: acc.location + review.rating.location,
        value: acc.value + review.rating.value,
      }),
      { communication: 0, appearance: 0, service: 0, location: 0, value: 0 }
    );

    return {
      communication: sum.communication / reviews.length,
      appearance: sum.appearance / reviews.length,
      service: sum.service / reviews.length,
      location: sum.location / reviews.length,
      value: sum.value / reviews.length,
    };
  }

  private async validateBooking(bookingId: string, clientId: string): Promise<any> {
    // Implement booking validation logic
    // Should check if booking exists, is completed, and belongs to the client
    return true; // Placeholder
  }
}