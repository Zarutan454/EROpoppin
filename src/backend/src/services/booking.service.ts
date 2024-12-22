import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../models/Booking';
import { BookingRequest } from '../../shared/types/booking';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { ApiError } from '../utils/ApiError';
import { validate } from 'class-validator';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

  async createBooking(bookingData: BookingRequest): Promise<Booking> {
    const booking = this.bookingRepository.create(bookingData);
    
    // Validate booking requirements
    await this.validateBookingRequirements(booking);

    // Save booking
    const savedBooking = await this.bookingRepository.save(booking);

    // Send notifications
    await this.sendBookingNotifications(savedBooking);

    return savedBooking;
  }

  private async validateBookingRequirements(booking: Booking) {
    // Validate minimum age
    if (!booking.verificationRequired) {
      throw new ApiError('Verification is required for all bookings', 400);
    }

    // Validate deposit if required
    if (booking.deposit && (!booking.depositAmount || booking.depositAmount <= 0)) {
      throw new ApiError('Valid deposit amount is required', 400);
    }

    // Validate terms agreement
    if (!booking.agreesToTerms) {
      throw new ApiError('Terms must be agreed to proceed', 400);
    }

    // Validate booking duration
    if (booking.duration < 1) {
      throw new ApiError('Minimum booking duration is 1 hour', 400);
    }

    // Additional validations here...
  }

  private async sendBookingNotifications(booking: Booking) {
    // Notify escort
    await this.notificationsService.send({
      userId: booking.escortId,
      title: 'New Booking Request',
      message: 'You have received a new booking request',
      type: 'booking_request',
      data: { bookingId: booking.id },
      priority: 'high'
    });

    // Send confirmation email to client
    await this.emailService.send({
      to: booking.client.email,
      subject: 'Booking Request Confirmation',
      template: 'booking-confirmation',
      context: {
        booking: booking,
        clientName: booking.client.name
      }
    });
  }

  async getBookingById(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['escort', 'client']
    });

    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }

    return booking;
  }

  async updateBookingStatus(
    id: string,
    status: 'confirmed' | 'rejected' | 'cancelled',
    response?: { message?: string; alternativeTime?: string }
  ): Promise<Booking> {
    const booking = await this.getBookingById(id);
    
    booking.status = status;
    if (response) {
      booking.escortResponse = {
        status: status === 'confirmed' ? 'accepted' : 'rejected',
        ...response
      };
    }

    const updatedBooking = await this.bookingRepository.save(booking);

    // Send status update notifications
    await this.sendStatusUpdateNotifications(updatedBooking);

    return updatedBooking;
  }

  private async sendStatusUpdateNotifications(booking: Booking) {
    const notificationData = {
      confirmed: {
        title: 'Booking Confirmed',
        message: 'Your booking has been confirmed',
        type: 'booking_confirmed'
      },
      rejected: {
        title: 'Booking Declined',
        message: 'Your booking request was declined',
        type: 'booking_rejected'
      },
      cancelled: {
        title: 'Booking Cancelled',
        message: 'The booking has been cancelled',
        type: 'booking_cancelled'
      }
    }[booking.status];

    if (notificationData) {
      // Notify client
      await this.notificationsService.send({
        userId: booking.clientId,
        ...notificationData,
        data: { bookingId: booking.id }
      });

      // Send email notification
      await this.emailService.send({
        to: booking.client.email,
        subject: notificationData.title,
        template: `booking-${booking.status}`,
        context: {
          booking: booking,
          clientName: booking.client.name,
          escortName: booking.escort.name
        }
      });
    }
  }

  async getUpcomingBookings(userId: string, role: 'escort' | 'client'): Promise<Booking[]> {
    const queryField = role === 'escort' ? 'escortId' : 'clientId';
    
    return this.bookingRepository.find({
      where: {
        [queryField]: userId,
        status: 'confirmed',
        date: MoreThan(new Date())
      },
      order: {
        date: 'ASC',
        startTime: 'ASC'
      },
      relations: ['escort', 'client']
    });
  }
}