import { Between, EntityRepository, Repository } from 'typeorm';
import { Review } from '../models/Review';
import { ReviewFilter, ReviewStats } from '@shared/types/review';

@EntityRepository(Review)
export class ReviewRepository extends Repository<Review> {
  async findByFilter(
    filter: ReviewFilter,
    page = 1,
    limit = 10
  ): Promise<[Review[], number]> {
    const query = this.createQueryBuilder('review')
      .leftJoinAndSelect('review.response', 'response')
      .where('review.escortId = :escortId', { escortId: filter.escortId });

    if (filter.clientId) {
      query.andWhere('review.clientId = :clientId', {
        clientId: filter.clientId,
      });
    }

    if (filter.bookingId) {
      query.andWhere('review.bookingId = :bookingId', {
        bookingId: filter.bookingId,
      });
    }

    if (filter.minRating) {
      query.andWhere('review.rating->>\'overall\' >= :minRating', {
        minRating: filter.minRating,
      });
    }

    if (filter.startDate && filter.endDate) {
      query.andWhere('review.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    }

    if (filter.isVerified !== undefined) {
      query.andWhere('review.isVerified = :isVerified', {
        isVerified: filter.isVerified,
      });
    }

    if (filter.isPublic !== undefined) {
      query.andWhere('review.isPublic = :isPublic', {
        isPublic: filter.isPublic,
      });
    }

    query
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return query.getManyAndCount();
  }

  async getStats(escortId: string): Promise<ReviewStats> {
    const [reviews, total] = await this.findAndCount({
      where: { escortId },
    });

    const verifiedReviews = reviews.filter(r => r.isVerified).length;
    const ratingDistribution: Record<number, number> = {};
    let totalRating = {
      overall: 0,
      communication: 0,
      appearance: 0,
      service: 0,
      location: 0,
      value: 0,
    };

    reviews.forEach(review => {
      const overall = Math.round(review.rating.overall);
      ratingDistribution[overall] = (ratingDistribution[overall] || 0) + 1;

      Object.keys(totalRating).forEach(key => {
        totalRating[key] += review.rating[key];
      });
    });

    const averageRating = Object.keys(totalRating).reduce(
      (acc, key) => ({
        ...acc,
        [key]: total > 0 ? totalRating[key] / total : 0,
      }),
      {} as Record<string, number>
    );

    const recommendationRate =
      total > 0
        ? reviews.filter(r => r.rating.overall >= 4).length / total
        : 0;

    return {
      totalReviews: total,
      averageRating,
      verifiedReviews,
      recommendationRate,
      ratingDistribution,
    };
  }

  async findByBookingId(bookingId: string): Promise<Review | undefined> {
    return this.findOne({
      where: { bookingId },
      relations: ['response'],
    });
  }
}