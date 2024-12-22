import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReviewRepository } from '../repositories/ReviewRepository';
import { BookingService } from './BookingService';
import { StorageService } from './StorageService';
import { Review } from '../models/Review';
import { ReviewResponse } from '../models/ReviewResponse';
import {
  ReviewRequest,
  ReviewResponseRequest,
  ReviewFilter,
} from '@shared/types/review';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ReviewRepository)
    private reviewRepository: ReviewRepository,
    private bookingService: BookingService,
    private storageService: StorageService,
  ) {}

  async create(userId: string, data: ReviewRequest): Promise<Review> {
    // Check if booking exists and belongs to user
    const booking = await this.bookingService.findById(data.bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.clientId !== userId) {
      throw new ForbiddenException('Cannot review someone else\'s booking');
    }

    // Check if review already exists for this booking
    const existingReview = await this.reviewRepository.findByBookingId(
      data.bookingId,
    );
    if (existingReview) {
      throw new BadRequestException('Review already exists for this booking');
    }

    // Upload photos if provided
    let photoUrls: string[] | undefined;
    if (data.photos?.length) {
      photoUrls = await Promise.all(
        data.photos.map(photo =>
          this.storageService.uploadFile(photo, 'review-photos'),
        ),
      );
    }

    // Create review
    const review = this.reviewRepository.create({
      ...data,
      clientId: userId,
      photos: photoUrls,
      isVerified: true, // Auto-verify since we checked the booking
    });

    return this.reviewRepository.save(review);
  }

  async update(
    userId: string,
    reviewId: string,
    data: Partial<ReviewRequest>,
  ): Promise<Review> {
    const review = await this.reviewRepository.findOne(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.clientId !== userId) {
      throw new ForbiddenException('Cannot update someone else\'s review');
    }

    // Handle photo updates if provided
    if (data.photos) {
      // Delete old photos
      if (review.photos?.length) {
        await Promise.all(
          review.photos.map(url =>
            this.storageService.deleteFile(url),
          ),
        );
      }

      // Upload new photos
      const photoUrls = await Promise.all(
        data.photos.map(photo =>
          this.storageService.uploadFile(photo, 'review-photos'),
        ),
      );
      review.photos = photoUrls;
    }

    // Update other fields
    Object.assign(review, {
      ...data,
      photos: review.photos,
    });

    return this.reviewRepository.save(review);
  }

  async delete(userId: string, reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findOne(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.clientId !== userId) {
      throw new ForbiddenException('Cannot delete someone else\'s review');
    }

    // Delete photos if they exist
    if (review.photos?.length) {
      await Promise.all(
        review.photos.map(url =>
          this.storageService.deleteFile(url),
        ),
      );
    }

    await this.reviewRepository.remove(review);
  }

  async respond(
    userId: string,
    reviewId: string,
    data: ReviewResponseRequest,
  ): Promise<Review> {
    const review = await this.reviewRepository.findOne(reviewId, {
      relations: ['response'],
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.escortId !== userId) {
      throw new ForbiddenException('Cannot respond to reviews for other escorts');
    }
    if (review.response) {
      throw new BadRequestException('Response already exists');
    }

    const response = new ReviewResponse();
    response.reviewId = reviewId;
    response.escortId = userId;
    response.content = data.content;

    review.response = response;

    return this.reviewRepository.save(review);
  }

  async findAll(
    filter: ReviewFilter,
    page = 1,
    limit = 10,
  ) {
    const [reviews, total] = await this.reviewRepository.findByFilter(
      filter,
      page,
      limit,
    );

    const stats = await this.reviewRepository.getStats(filter.escortId);

    return {
      reviews,
      total,
      stats,
    };
  }

  async findById(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne(reviewId, {
      relations: ['response'],
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }
}