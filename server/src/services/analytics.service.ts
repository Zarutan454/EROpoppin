import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Booking } from '../models/Booking';
import { Review } from '../models/Review';
import { EscortProfile } from '../models/EscortProfile';
import { RedisService } from './redis';

interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
}

interface RevenueAnalytics {
  total: number;
  byService: Record<string, number>;
  byLocation: Record<string, number>;
  trend: {
    date: string;
    amount: number;
  }[];
}

interface BookingAnalytics {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  avgDuration: number;
  popularTimeSlots: {
    timeSlot: string;
    count: number;
  }[];
  repeatClientRate: number;
}

interface ReviewAnalytics {
  total: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  commonKeywords: {
    word: string;
    count: number;
  }[];
}

interface PerformanceMetrics {
  conversionRate: number;
  responseRate: number;
  averageResponseTime: number;
  clientRetentionRate: number;
  profileViews: number;
  searchAppearances: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(EscortProfile)
    private escortRepository: Repository<EscortProfile>,
    private redisService: RedisService
  ) {}

  async getEscortDashboard(escortId: string, period: AnalyticsPeriod) {
    const [
      revenue,
      bookings,
      reviews,
      performance
    ] = await Promise.all([
      this.getRevenueAnalytics(escortId, period),
      this.getBookingAnalytics(escortId, period),
      this.getReviewAnalytics(escortId, period),
      this.getPerformanceMetrics(escortId, period)
    ]);

    return {
      revenue,
      bookings,
      reviews,
      performance
    };
  }

  private async getRevenueAnalytics(
    escortId: string,
    period: AnalyticsPeriod
  ): Promise<RevenueAnalytics> {
    const bookings = await this.bookingRepository.find({
      where: {
        escortId,
        startTime: Between(period.startDate, period.endDate),
        status: 'completed'
      }
    });

    const revenue: RevenueAnalytics = {
      total: 0,
      byService: {},
      byLocation: {},
      trend: []
    };

    // Calculate daily revenue trend
    const dailyRevenue = new Map<string, number>();

    bookings.forEach(booking => {
      // Total revenue
      revenue.total += booking.totalAmount;

      // Revenue by service
      booking.services.forEach(service => {
        revenue.byService[service] = (revenue.byService[service] || 0) + booking.totalAmount;
      });

      // Revenue by location
      const location = booking.location.city;
      revenue.byLocation[location] = (revenue.byLocation[location] || 0) + booking.totalAmount;

      // Daily trend
      const date = booking.startTime.toISOString().split('T')[0];
      dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + booking.totalAmount);
    });

    // Convert daily revenue map to sorted array
    revenue.trend = Array.from(dailyRevenue.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return revenue;
  }

  private async getBookingAnalytics(
    escortId: string,
    period: AnalyticsPeriod
  ): Promise<BookingAnalytics> {
    const bookings = await this.bookingRepository.find({
      where: {
        escortId,
        startTime: Between(period.startDate, period.endDate)
      }
    });

    const analytics: BookingAnalytics = {
      total: bookings.length,
      completed: 0,
      cancelled: 0,
      pending: 0,
      avgDuration: 0,
      popularTimeSlots: [],
      repeatClientRate: 0
    };

    // Time slot counter
    const timeSlots = new Map<string, number>();
    // Client counter
    const clients = new Set<string>();
    const repeatClients = new Set<string>();

    let totalDuration = 0;

    bookings.forEach(booking => {
      // Status counts
      switch (booking.status) {
        case 'completed':
          analytics.completed++;
          break;
        case 'cancelled':
          analytics.cancelled++;
          break;
        case 'pending':
          analytics.pending++;
          break;
      }

      // Duration
      const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60); // in minutes
      totalDuration += duration;

      // Time slots
      const hour = booking.startTime.getHours();
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      timeSlots.set(timeSlot, (timeSlots.get(timeSlot) || 0) + 1);

      // Repeat clients
      if (clients.has(booking.clientId)) {
        repeatClients.add(booking.clientId);
      } else {
        clients.add(booking.clientId);
      }
    });

    // Calculate average duration
    analytics.avgDuration = totalDuration / bookings.length;

    // Get popular time slots
    analytics.popularTimeSlots = Array.from(timeSlots.entries())
      .map(([timeSlot, count]) => ({ timeSlot, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate repeat client rate
    analytics.repeatClientRate = clients.size > 0 
      ? repeatClients.size / clients.size
      : 0;

    return analytics;
  }

  private async getReviewAnalytics(
    escortId: string,
    period: AnalyticsPeriod
  ): Promise<ReviewAnalytics> {
    const reviews = await this.reviewRepository.find({
      where: {
        escortId,
        createdAt: Between(period.startDate, period.endDate)
      }
    });

    const analytics: ReviewAnalytics = {
      total: reviews.length,
      averageRating: 0,
      ratingDistribution: {},
      sentimentAnalysis: {
        positive: 0,
        neutral: 0,
        negative: 0
      },
      commonKeywords: []
    };

    // Word frequency counter
    const keywords = new Map<string, number>();
    let totalRating = 0;

    reviews.forEach(review => {
      // Ratings
      totalRating += review.rating;
      analytics.ratingDistribution[review.rating] = 
        (analytics.ratingDistribution[review.rating] || 0) + 1;

      // Sentiment analysis based on rating
      if (review.rating >= 4) {
        analytics.sentimentAnalysis.positive++;
      } else if (review.rating >= 3) {
        analytics.sentimentAnalysis.neutral++;
      } else {
        analytics.sentimentAnalysis.negative++;
      }

      // Extract keywords from review content
      const words = review.content
        .toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 3); // Filter out short words

      words.forEach(word => {
        keywords.set(word, (keywords.get(word) || 0) + 1);
      });
    });

    // Calculate average rating
    analytics.averageRating = reviews.length > 0
      ? totalRating / reviews.length
      : 0;

    // Get most common keywords
    analytics.commonKeywords = Array.from(keywords.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return analytics;
  }

  private async getPerformanceMetrics(
    escortId: string,
    period: AnalyticsPeriod
  ): Promise<PerformanceMetrics> {
    // Get profile views from Redis
    const viewsKey = `profile:${escortId}:views`;
    const searchKey = `profile:${escortId}:search_appearances`;

    const [
      profileViews,
      searchAppearances,
      bookings,
      messages
    ] = await Promise.all([
      this.redisService.get(viewsKey),
      this.redisService.get(searchKey),
      this.bookingRepository.find({
        where: {
          escortId,
          createdAt: Between(period.startDate, period.endDate)
        }
      }),
      this.getMessageStats(escortId, period)
    ]);

    const metrics: PerformanceMetrics = {
      conversionRate: 0,
      responseRate: messages.responseRate,
      averageResponseTime: messages.averageResponseTime,
      clientRetentionRate: 0,
      profileViews: parseInt(profileViews || '0'),
      searchAppearances: parseInt(searchAppearances || '0')
    };

    // Calculate conversion rate (bookings / profile views)
    metrics.conversionRate = metrics.profileViews > 0
      ? bookings.length / metrics.profileViews
      : 0;

    // Calculate client retention rate
    const repeatClients = new Set(
      bookings
        .filter(b => b.status === 'completed')
        .map(b => b.clientId)
    );

    const previousPeriodClients = await this.getClientsFromPreviousPeriod(
      escortId,
      period
    );

    metrics.clientRetentionRate = previousPeriodClients.size > 0
      ? Array.from(repeatClients).filter(id => previousPeriodClients.has(id)).length / previousPeriodClients.size
      : 0;

    return metrics;
  }

  private async getMessageStats(
    escortId: string,
    period: AnalyticsPeriod
  ) {
    // This would integrate with your messaging system
    // Returning dummy data for now
    return {
      responseRate: 0.95,
      averageResponseTime: 5 // minutes
    };
  }

  private async getClientsFromPreviousPeriod(
    escortId: string,
    currentPeriod: AnalyticsPeriod
  ): Promise<Set<string>> {
    const periodDuration = currentPeriod.endDate.getTime() - currentPeriod.startDate.getTime();
    const previousPeriodStart = new Date(currentPeriod.startDate.getTime() - periodDuration);
    const previousPeriodEnd = currentPeriod.startDate;

    const previousBookings = await this.bookingRepository.find({
      where: {
        escortId,
        startTime: Between(previousPeriodStart, previousPeriodEnd),
        status: 'completed'
      }
    });

    return new Set(previousBookings.map(b => b.clientId));
  }

  // Admin-level analytics
  async getPlatformAnalytics(period: AnalyticsPeriod) {
    const [
      bookingStats,
      revenueStats,
      userStats,
      verificationStats
    ] = await Promise.all([
      this.getPlatformBookingStats(period),
      this.getPlatformRevenueStats(period),
      this.getPlatformUserStats(period),
      this.getPlatformVerificationStats(period)
    ]);

    return {
      bookings: bookingStats,
      revenue: revenueStats,
      users: userStats,
      verification: verificationStats
    };
  }

  private async getPlatformBookingStats(period: AnalyticsPeriod) {
    // Implementation for platform-wide booking statistics
    return {};
  }

  private async getPlatformRevenueStats(period: AnalyticsPeriod) {
    // Implementation for platform-wide revenue statistics
    return {};
  }

  private async getPlatformUserStats(period: AnalyticsPeriod) {
    // Implementation for platform-wide user statistics
    return {};
  }

  private async getPlatformVerificationStats(period: AnalyticsPeriod) {
    // Implementation for platform-wide verification statistics
    return {};
  }
}
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Booking } from '../models/Booking';
import { Review } from '../models/Review';
import { ProfileView } from '../models/ProfileView';
import { Payment } from '../models/Payment';
import { redis } from './redis';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns';

interface TimeRange {
  start: Date;
  end: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(ProfileView)
    private profileViewRepository: Repository<ProfileView>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async getAnalytics(userId: string, timeRange: string): Promise<any> {
    const range = this.getTimeRange(timeRange);
    const cacheKey = `analytics:${userId}:${timeRange}`;

    // Try to get cached data
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Calculate all analytics
    const [earnings, bookings, profile, reviews] = await Promise.all([
      this.getEarningsAnalytics(userId, range),
      this.getBookingsAnalytics(userId, range),
      this.getProfileAnalytics(userId, range),
      this.getReviewsAnalytics(userId),
    ]);

    const analytics = {
      earnings,
      bookings,
      profile,
      reviews,
    };

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(analytics));

    return analytics;
  }

  private getTimeRange(timeRange: string): TimeRange {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return {
          start: subDays(startOfDay(now), 7),
          end: endOfDay(now),
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case 'year':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
    }
  }

  private async getEarningsAnalytics(
    userId: string,
    range: TimeRange,
  ) {
    const payments = await this.paymentRepository.find({
      where: {
        escortId: userId,
        status: 'completed',
        createdAt: Between(range.start, range.end),
      },
    });

    const daily = payments.reduce((acc, payment) => {
      const date = format(payment.createdAt, 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: payments.reduce((sum, p) => sum + p.amount, 0),
      lastMonth: payments
        .filter(p => p.createdAt >= startOfMonth(subDays(new Date(), 30)))
        .reduce((sum, p) => sum + p.amount, 0),
      thisMonth: payments
        .filter(p => p.createdAt >= startOfMonth(new Date()))
        .reduce((sum, p) => sum + p.amount, 0),
      daily: Object.entries(daily).map(([date, amount]) => ({
        date,
        amount,
      })),
    };
  }

  private async getBookingsAnalytics(
    userId: string,
    range: TimeRange,
  ) {
    const bookings = await this.bookingRepository.find({
      where: {
        escortId: userId,
        createdAt: Between(range.start, range.end),
      },
    });

    const monthly = bookings.reduce((acc, booking) => {
      const month = format(booking.createdAt, 'MMM yyyy');
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: bookings.length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      monthly: Object.entries(monthly).map(([month, count]) => ({
        month,
        count,
      })),
    };
  }

  private async getProfileAnalytics(
    userId: string,
    range: TimeRange,
  ) {
    const views = await this.profileViewRepository.count({
      where: {
        escortId: userId,
        createdAt: Between(range.start, range.end),
      },
    });

    const favorites = await this.profileViewRepository.count({
      where: {
        escortId: userId,
        isFavorite: true,
      },
    });

    const messages = await this.getMessageStats(userId, range);

    return {
      views,
      favorites,
      contactRate: messages.contactRate,
      responseRate: messages.responseRate,
    };
  }

  private async getMessageStats(userId: string, range: TimeRange) {
    // This would be implemented based on your message system
    return {
      contactRate: 0.75, // Placeholder
      responseRate: 0.85, // Placeholder
    };
  }

  private async getReviewsAnalytics(userId: string) {
    const reviews = await this.reviewRepository.find({
      where: { escortId: userId },
    });

    const distribution = reviews.reduce((acc, review) => {
      const rating = Math.round(
        Object.values(review.rating).reduce((sum, r) => sum + r, 0) / 5,
      );
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const average =
      reviews.length > 0
        ? reviews.reduce(
            (sum, review) =>
              sum +
              Object.values(review.rating).reduce((s, r) => s + r, 0) / 5,
            0,
          ) / reviews.length
        : 0;

    return {
      total: reviews.length,
      average,
      distribution,
    };
  }

  async refreshAnalytics(userId: string): Promise<void> {
    // Clear all analytics cache for user
    const keys = await redis.keys(`analytics:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  }
}