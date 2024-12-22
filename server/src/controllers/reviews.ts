import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendNotification } from '../services/notifications';
import { sendEmail } from '../services/email';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

// Create review
export const createReview = async (req: Request, res: Response) => {
  const { booking_id, rating, comment, anonymous, tags } = req.body;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: booking_id },
      include: {
        provider: {
          select: {
            id: true,
            email: true,
            full_name: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (booking.user_id !== req.user.id) {
      throw new ApiError(403, 'You can only review your own bookings');
    }

    if (booking.status !== 'completed') {
      throw new ApiError(400, 'You can only review completed bookings');
    }

    const existingReview = await prisma.review.findFirst({
      where: { booking_id },
    });

    if (existingReview) {
      throw new ApiError(400, 'You have already reviewed this booking');
    }

    const review = await prisma.review.create({
      data: {
        booking_id,
        user_id: req.user.id,
        provider_id: booking.provider_id,
        rating,
        comment,
        anonymous,
        tags,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    // Update provider rating
    const providerReviews = await prisma.review.findMany({
      where: { provider_id: booking.provider_id },
      select: { rating: true },
    });

    const averageRating =
      providerReviews.reduce((sum, review) => sum + review.rating, 0) /
      providerReviews.length;

    await prisma.providerProfile.update({
      where: { user_id: booking.provider_id },
      data: {
        rating: averageRating,
        total_reviews: providerReviews.length,
      },
    });

    // Send notifications
    await Promise.all([
      sendNotification({
        user_id: booking.provider_id,
        title: 'New Review',
        message: `You received a ${rating}-star review`,
        type: 'review',
        data: { review_id: review.id },
      }),
      sendEmail({
        to: booking.provider.email,
        subject: 'New Review Received',
        template: 'new-review',
        context: {
          provider_name: booking.provider.full_name,
          rating,
          comment,
          reviewer_name: anonymous ? 'Anonymous' : req.user.full_name,
        },
      }),
    ]);

    res.status(201).json(review);
  } catch (error) {
    logger.error('Create review error:', error);
    throw error;
  }
};

// Get review
export const getReview = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
        provider: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
        booking: true,
      },
    });

    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    res.json(review);
  } catch (error) {
    logger.error('Get review error:', error);
    throw error;
  }
};

// Update review
export const updateReview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rating, comment, anonymous, tags } = req.body;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    if (review.user_id !== req.user.id) {
      throw new ApiError(403, 'You can only update your own reviews');
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        rating,
        comment,
        anonymous,
        tags,
        edited: true,
        edited_at: new Date(),
      },
    });

    // Update provider rating
    const providerReviews = await prisma.review.findMany({
      where: { provider_id: review.provider_id },
      select: { rating: true },
    });

    const averageRating =
      providerReviews.reduce((sum, review) => sum + review.rating, 0) /
      providerReviews.length;

    await prisma.providerProfile.update({
      where: { user_id: review.provider_id },
      data: {
        rating: averageRating,
      },
    });

    res.json(updatedReview);
  } catch (error) {
    logger.error('Update review error:', error);
    throw error;
  }
};

// Delete review
export const deleteReview = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'You do not have permission to delete this review');
    }

    await prisma.review.delete({
      where: { id },
    });

    // Update provider rating
    const providerReviews = await prisma.review.findMany({
      where: { provider_id: review.provider_id },
      select: { rating: true },
    });

    const averageRating = providerReviews.length
      ? providerReviews.reduce((sum, review) => sum + review.rating, 0) /
        providerReviews.length
      : 0;

    await prisma.providerProfile.update({
      where: { user_id: review.provider_id },
      data: {
        rating: averageRating,
        total_reviews: providerReviews.length,
      },
    });

    res.json({ message: 'Review deleted' });
  } catch (error) {
    logger.error('Delete review error:', error);
    throw error;
  }
};

// Get provider reviews
export const getProviderReviews = async (req: Request, res: Response) => {
  const { providerId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { provider_id: providerId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              full_name: true,
              avatar_url: true,
            },
          },
          booking: {
            select: {
              service: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.review.count({
        where: { provider_id: providerId },
      }),
    ]);

    res.json({
      reviews,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Get provider reviews error:', error);
    throw error;
  }
};

// Get user reviews
export const getUserReviews = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { user_id: req.user.id },
        include: {
          provider: {
            select: {
              id: true,
              username: true,
              full_name: true,
              avatar_url: true,
            },
          },
          booking: {
            select: {
              service: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.review.count({
        where: { user_id: req.user.id },
      }),
    ]);

    res.json({
      reviews,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Get user reviews error:', error);
    throw error;
  }
};

// Like review
export const likeReview = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    const existingLike = await prisma.reviewLike.findUnique({
      where: {
        user_id_review_id: {
          user_id: req.user.id,
          review_id: id,
        },
      },
    });

    if (existingLike) {
      throw new ApiError(400, 'You have already liked this review');
    }

    await prisma.reviewLike.create({
      data: {
        user_id: req.user.id,
        review_id: id,
      },
    });

    await prisma.review.update({
      where: { id },
      data: {
        likes: { increment: 1 },
      },
    });

    res.json({ message: 'Review liked' });
  } catch (error) {
    logger.error('Like review error:', error);
    throw error;
  }
};

// Unlike review
export const unlikeReview = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    await prisma.reviewLike.delete({
      where: {
        user_id_review_id: {
          user_id: req.user.id,
          review_id: id,
        },
      },
    });

    await prisma.review.update({
      where: { id },
      data: {
        likes: { decrement: 1 },
      },
    });

    res.json({ message: 'Review unliked' });
  } catch (error) {
    logger.error('Unlike review error:', error);
    throw error;
  }
};

// Report review
export const reportReview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason, details } = req.body;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    const report = await prisma.reviewReport.create({
      data: {
        review_id: id,
        reporter_id: req.user.id,
        reason,
        details,
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
    });

    await Promise.all(
      admins.map((admin) =>
        sendNotification({
          user_id: admin.id,
          title: 'Review Reported',
          message: `A review has been reported. Reason: ${reason}`,
          type: 'report',
          data: { report_id: report.id },
        })
      )
    );

    res.status(201).json(report);
  } catch (error) {
    logger.error('Report review error:', error);
    throw error;
  }
};

// Respond to review
export const respondToReview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { response } = req.body;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            full_name: true,
          },
        },
      },
    });

    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    if (review.provider_id !== req.user.id) {
      throw new ApiError(403, 'Only the provider can respond to this review');
    }

    if (review.provider_response) {
      throw new ApiError(400, 'You have already responded to this review');
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        provider_response: response,
        provider_response_at: new Date(),
      },
    });

    // Notify review author
    await Promise.all([
      sendNotification({
        user_id: review.user_id,
        title: 'Review Response',
        message: 'The provider has responded to your review',
        type: 'review',
        data: { review_id: review.id },
      }),
      sendEmail({
        to: review.user.email,
        subject: 'Provider Responded to Your Review',
        template: 'review-response',
        context: {
          user_name: review.user.full_name,
          provider_name: req.user.full_name,
          response,
        },
      }),
    ]);

    res.json(updatedReview);
  } catch (error) {
    logger.error('Respond to review error:', error);
    throw error;
  }
};

// Get review statistics
export const getReviewStatistics = async (req: Request, res: Response) => {
  try {
    const providerId = req.params.providerId || req.user.id;

    const [
      reviewStats,
      reviewsByRating,
      monthlyReviews,
      topTags,
    ] = await Promise.all([
      prisma.review.aggregate({
        where: { provider_id: providerId },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { provider_id: providerId },
        _count: true,
      }),
      prisma.$queryRaw`
        SELECT DATE_TRUNC('month', created_at) as month,
               COUNT(*) as count,
               AVG(rating) as average_rating
        FROM reviews
        WHERE provider_id = ${providerId}
          AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `,
      prisma.$queryRaw`
        SELECT unnest(tags) as tag,
               COUNT(*) as count
        FROM reviews
        WHERE provider_id = ${providerId}
          AND tags IS NOT NULL
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 10
      `,
    ]);

    res.json({
      averageRating: reviewStats._avg.rating || 0,
      totalReviews: reviewStats._count,
      ratingDistribution: reviewsByRating.reduce(
        (acc: { [key: number]: number }, curr) => {
          acc[curr.rating] = curr._count;
          return acc;
        },
        { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      ),
      monthlyReviews,
      topTags,
    });
  } catch (error) {
    logger.error('Get review statistics error:', error);
    throw error;
  }
};

// Moderate review
export const moderateReview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, reason } = req.body;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            full_name: true,
          },
        },
      },
    });

    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    let updatedReview;

    switch (action) {
      case 'approve':
        updatedReview = await prisma.review.update({
          where: { id },
          data: {
            status: 'approved',
            moderated_at: new Date(),
            moderated_by: req.user.id,
          },
        });
        break;

      case 'reject':
        updatedReview = await prisma.review.update({
          where: { id },
          data: {
            status: 'rejected',
            moderated_at: new Date(),
            moderated_by: req.user.id,
            moderation_reason: reason,
          },
        });

        // Notify user
        await Promise.all([
          sendNotification({
            user_id: review.user_id,
            title: 'Review Rejected',
            message: `Your review has been rejected. Reason: ${reason}`,
            type: 'review',
            data: { review_id: review.id },
          }),
          sendEmail({
            to: review.user.email,
            subject: 'Your Review Has Been Rejected',
            template: 'review-rejected',
            context: {
              user_name: review.user.full_name,
              reason,
            },
          }),
        ]);
        break;

      case 'flag':
        updatedReview = await prisma.review.update({
          where: { id },
          data: {
            status: 'flagged',
            moderated_at: new Date(),
            moderated_by: req.user.id,
            moderation_reason: reason,
          },
        });
        break;

      default:
        throw new ApiError(400, 'Invalid moderation action');
    }

    res.json(updatedReview);
  } catch (error) {
    logger.error('Moderate review error:', error);
    throw error;
  }
};