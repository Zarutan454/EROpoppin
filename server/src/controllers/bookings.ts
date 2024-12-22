import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendNotification } from '../services/notifications';
import { sendEmail } from '../services/email';
import { createCalendarEvent } from '../services/calendar';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { calculatePrice, generateBookingReference } from '../utils/booking';

const prisma = new PrismaClient();

// Create booking
export const createBooking = async (req: Request, res: Response) => {
  const {
    provider_id,
    service_id,
    start_time,
    duration,
    notes,
    extras,
  } = req.body;

  try {
    // Check provider availability
    const isAvailable = await checkProviderAvailability(
      provider_id,
      new Date(start_time),
      duration
    );

    if (!isAvailable) {
      throw new ApiError(400, 'Provider is not available at this time');
    }

    // Calculate price
    const price = await calculatePrice(provider_id, service_id, duration, extras);

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        reference: generateBookingReference(),
        user_id: req.user.id,
        provider_id,
        service_id,
        start_time: new Date(start_time),
        duration,
        price,
        notes,
        extras,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            email: true,
            full_name: true,
          },
        },
        provider: {
          select: {
            email: true,
            full_name: true,
          },
        },
        service: true,
      },
    });

    // Send notifications
    await Promise.all([
      sendNotification({
        user_id: provider_id,
        title: 'New Booking Request',
        message: `You have a new booking request from ${req.user.full_name}`,
        type: 'booking',
        data: { booking_id: booking.id },
      }),
      sendEmail({
        to: booking.provider.email,
        subject: 'New Booking Request',
        template: 'booking-request',
        context: {
          provider_name: booking.provider.full_name,
          client_name: booking.user.full_name,
          booking_reference: booking.reference,
          start_time: booking.start_time,
          duration: booking.duration,
          price: booking.price,
        },
      }),
      sendEmail({
        to: booking.user.email,
        subject: 'Booking Confirmation',
        template: 'booking-confirmation',
        context: {
          client_name: booking.user.full_name,
          provider_name: booking.provider.full_name,
          booking_reference: booking.reference,
          start_time: booking.start_time,
          duration: booking.duration,
          price: booking.price,
        },
      }),
    ]);

    res.status(201).json(booking);
  } catch (error) {
    logger.error('Create booking error:', error);
    throw error;
  }
};

// Get booking
export const getBooking = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const booking = await prisma.booking.findUnique({
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
        service: true,
        reviews: true,
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    // Check if user has permission to view booking
    if (
      booking.user_id !== req.user.id &&
      booking.provider_id !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      throw new ApiError(403, 'You do not have permission to view this booking');
    }

    res.json(booking);
  } catch (error) {
    logger.error('Get booking error:', error);
    throw error;
  }
};

// Get user bookings
export const getUserBookings = async (req: Request, res: Response) => {
  const { status, page = 1, limit = 10 } = req.query;

  try {
    const where: any = { user_id: req.user.id };
    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          provider: {
            select: {
              id: true,
              username: true,
              full_name: true,
              avatar_url: true,
            },
          },
          service: true,
        },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      bookings,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Get user bookings error:', error);
    throw error;
  }
};

// Get provider bookings
export const getProviderBookings = async (req: Request, res: Response) => {
  const { status, page = 1, limit = 10 } = req.query;

  try {
    const where: any = { provider_id: req.user.id };
    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              full_name: true,
              avatar_url: true,
            },
          },
          service: true,
        },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      bookings,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Get provider bookings error:', error);
    throw error;
  }
};

// Update booking
export const updateBooking = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            full_name: true,
          },
        },
        provider: {
          select: {
            email: true,
            full_name: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    // Check if user has permission to update booking
    if (
      booking.provider_id !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      throw new ApiError(403, 'You do not have permission to update this booking');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status, notes },
    });

    // Send notifications
    await Promise.all([
      sendNotification({
        user_id: booking.user_id,
        title: 'Booking Updated',
        message: `Your booking status has been updated to ${status}`,
        type: 'booking',
        data: { booking_id: booking.id },
      }),
      sendEmail({
        to: booking.user.email,
        subject: 'Booking Status Updated',
        template: 'booking-update',
        context: {
          client_name: booking.user.full_name,
          booking_reference: booking.reference,
          status,
          notes,
        },
      }),
    ]);

    if (status === 'confirmed') {
      // Create calendar event
      await createCalendarEvent({
        title: `Booking with ${booking.user.full_name}`,
        start: booking.start_time,
        end: new Date(booking.start_time.getTime() + booking.duration * 60000),
        description: booking.notes,
        attendees: [booking.user.email, booking.provider.email],
      });
    }

    res.json(updatedBooking);
  } catch (error) {
    logger.error('Update booking error:', error);
    throw error;
  }
};

// Cancel booking
export const cancelBooking = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            full_name: true,
          },
        },
        provider: {
          select: {
            email: true,
            full_name: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    // Check if user has permission to cancel booking
    if (
      booking.user_id !== req.user.id &&
      booking.provider_id !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      throw new ApiError(403, 'You do not have permission to cancel this booking');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: req.user.id,
        cancelled_at: new Date(),
      },
    });

    // Send notifications
    const canceledBy =
      req.user.id === booking.user_id ? 'client' : 'provider';
    
    await Promise.all([
      sendNotification({
        user_id:
          canceledBy === 'client' ? booking.provider_id : booking.user_id,
        title: 'Booking Cancelled',
        message: `Booking has been cancelled by ${
          canceledBy === 'client' ? 'the client' : 'the provider'
        }`,
        type: 'booking',
        data: { booking_id: booking.id },
      }),
      sendEmail({
        to: canceledBy === 'client' ? booking.provider.email : booking.user.email,
        subject: 'Booking Cancelled',
        template: 'booking-cancellation',
        context: {
          recipient_name:
            canceledBy === 'client'
              ? booking.provider.full_name
              : booking.user.full_name,
          booking_reference: booking.reference,
          cancellation_reason: reason,
          cancelled_by: canceledBy,
        },
      }),
    ]);

    res.json(updatedBooking);
  } catch (error) {
    logger.error('Cancel booking error:', error);
    throw error;
  }
};

// Confirm booking
export const confirmBooking = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            full_name: true,
          },
        },
        provider: {
          select: {
            email: true,
            full_name: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (booking.provider_id !== req.user.id) {
      throw new ApiError(403, 'Only the provider can confirm bookings');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'confirmed' },
    });

    // Send notifications
    await Promise.all([
      sendNotification({
        user_id: booking.user_id,
        title: 'Booking Confirmed',
        message: `Your booking has been confirmed by ${booking.provider.full_name}`,
        type: 'booking',
        data: { booking_id: booking.id },
      }),
      sendEmail({
        to: booking.user.email,
        subject: 'Booking Confirmed',
        template: 'booking-confirmation',
        context: {
          client_name: booking.user.full_name,
          provider_name: booking.provider.full_name,
          booking_reference: booking.reference,
          start_time: booking.start_time,
          duration: booking.duration,
        },
      }),
      createCalendarEvent({
        title: `Booking with ${booking.user.full_name}`,
        start: booking.start_time,
        end: new Date(booking.start_time.getTime() + booking.duration * 60000),
        description: booking.notes,
        attendees: [booking.user.email, booking.provider.email],
      }),
    ]);

    res.json(updatedBooking);
  } catch (error) {
    logger.error('Confirm booking error:', error);
    throw error;
  }
};

// Reschedule booking
export const rescheduleBooking = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { new_start_time, reason } = req.body;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            full_name: true,
          },
        },
        provider: {
          select: {
            email: true,
            full_name: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    // Check if user has permission to reschedule booking
    if (
      booking.user_id !== req.user.id &&
      booking.provider_id !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      throw new ApiError(403, 'You do not have permission to reschedule this booking');
    }

    // Check provider availability for new time
    const isAvailable = await checkProviderAvailability(
      booking.provider_id,
      new Date(new_start_time),
      booking.duration
    );

    if (!isAvailable) {
      throw new ApiError(400, 'Provider is not available at this time');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        start_time: new Date(new_start_time),
        rescheduled: true,
        rescheduled_by: req.user.id,
        reschedule_reason: reason,
      },
    });

    // Send notifications
    const rescheduledBy =
      req.user.id === booking.user_id ? 'client' : 'provider';

    await Promise.all([
      sendNotification({
        user_id:
          rescheduledBy === 'client' ? booking.provider_id : booking.user_id,
        title: 'Booking Rescheduled',
        message: `Booking has been rescheduled by ${
          rescheduledBy === 'client' ? 'the client' : 'the provider'
        }`,
        type: 'booking',
        data: { booking_id: booking.id },
      }),
      sendEmail({
        to: rescheduledBy === 'client' ? booking.provider.email : booking.user.email,
        subject: 'Booking Rescheduled',
        template: 'booking-reschedule',
        context: {
          recipient_name:
            rescheduledBy === 'client'
              ? booking.provider.full_name
              : booking.user.full_name,
          booking_reference: booking.reference,
          new_start_time: new Date(new_start_time),
          reason,
          rescheduled_by: rescheduledBy,
        },
      }),
      createCalendarEvent({
        title: `Booking with ${
          rescheduledBy === 'client'
            ? booking.user.full_name
            : booking.provider.full_name
        }`,
        start: new Date(new_start_time),
        end: new Date(
          new Date(new_start_time).getTime() + booking.duration * 60000
        ),
        description: booking.notes,
        attendees: [booking.user.email, booking.provider.email],
      }),
    ]);

    res.json(updatedBooking);
  } catch (error) {
    logger.error('Reschedule booking error:', error);
    throw error;
  }
};

// Helper function to check provider availability
const checkProviderAvailability = async (
  providerId: string,
  startTime: Date,
  duration: number
) => {
  const endTime = new Date(startTime.getTime() + duration * 60000);

  // Check if the time slot overlaps with existing bookings
  const existingBooking = await prisma.booking.findFirst({
    where: {
      provider_id: providerId,
      status: { in: ['pending', 'confirmed'] },
      OR: [
        {
          AND: [
            { start_time: { lte: startTime } },
            {
              start_time: {
                gt: new Date(startTime.getTime() - duration * 60000),
              },
            },
          ],
        },
        {
          AND: [
            { start_time: { lt: endTime } },
            { start_time: { gte: startTime } },
          ],
        },
      ],
    },
  });

  if (existingBooking) {
    return false;
  }

  // Check provider's availability schedule
  const dayOfWeek = startTime.getDay();
  const timeOfDay = startTime.toTimeString().slice(0, 5); // HH:mm format

  const availability = await prisma.availability.findFirst({
    where: {
      provider_id: providerId,
      day: dayOfWeek,
      start: { lte: timeOfDay },
      end: { gte: timeOfDay },
      available: true,
    },
  });

  return !!availability;
};

// Get booking history
export const getBookingHistory = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const where =
      req.user.role === 'provider'
        ? { provider_id: req.user.id }
        : { user_id: req.user.id };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
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
          service: true,
          reviews: true,
        },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      bookings,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Get booking history error:', error);
    throw error;
  }
};

// Get upcoming bookings
export const getUpcomingBookings = async (req: Request, res: Response) => {
  try {
    const where =
      req.user.role === 'provider'
        ? { provider_id: req.user.id }
        : { user_id: req.user.id };

    const bookings = await prisma.booking.findMany({
      where: {
        ...where,
        status: { in: ['pending', 'confirmed'] },
        start_time: { gte: new Date() },
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
        provider: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
        service: true,
      },
      orderBy: { start_time: 'asc' },
    });

    res.json(bookings);
  } catch (error) {
    logger.error('Get upcoming bookings error:', error);
    throw error;
  }
};

// Get past bookings
export const getPastBookings = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const where =
      req.user.role === 'provider'
        ? { provider_id: req.user.id }
        : { user_id: req.user.id };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: {
          ...where,
          start_time: { lt: new Date() },
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
          provider: {
            select: {
              id: true,
              username: true,
              full_name: true,
              avatar_url: true,
            },
          },
          service: true,
          reviews: true,
        },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        orderBy: { start_time: 'desc' },
      }),
      prisma.booking.count({
        where: {
          ...where,
          start_time: { lt: new Date() },
        },
      }),
    ]);

    res.json({
      bookings,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Get past bookings error:', error);
    throw error;
  }
};

// Get booking statistics
export const getBookingStatistics = async (req: Request, res: Response) => {
  try {
    const where =
      req.user.role === 'provider'
        ? { provider_id: req.user.id }
        : { user_id: req.user.id };

    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      upcomingBookings,
      totalRevenue,
      averageRating,
    ] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.count({ where: { ...where, status: 'completed' } }),
      prisma.booking.count({ where: { ...where, status: 'cancelled' } }),
      prisma.booking.count({
        where: {
          ...where,
          status: { in: ['pending', 'confirmed'] },
          start_time: { gte: new Date() },
        },
      }),
      prisma.booking.aggregate({
        where: { ...where, status: 'completed' },
        _sum: { price: true },
      }),
      prisma.review.aggregate({
        where: { booking: { [req.user.role === 'provider' ? 'provider_id' : 'user_id']: req.user.id } },
        _avg: { rating: true },
      }),
    ]);

    // Get monthly booking counts
    const monthlyBookings = await prisma.$queryRaw`
      SELECT DATE_TRUNC('month', start_time) as month,
             COUNT(*) as count,
             SUM(price) as revenue
      FROM bookings
      WHERE ${where} AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
      GROUP BY DATE_TRUNC('month', start_time)
      ORDER BY month DESC
    `;

    res.json({
      totalBookings,
      completedBookings,
      cancelledBookings,
      upcomingBookings,
      totalRevenue: totalRevenue._sum.price || 0,
      averageRating: averageRating._avg.rating || 0,
      monthlyBookings,
    });
  } catch (error) {
    logger.error('Get booking statistics error:', error);
    throw error;
  }
};