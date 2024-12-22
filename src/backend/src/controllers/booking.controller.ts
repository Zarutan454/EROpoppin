import { Controller, Post, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from '../services/booking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingRequest } from '../shared/types/booking';
import { Request } from 'express';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking request' })
  @ApiResponse({ status: 201, description: 'Booking request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid booking data' })
  async createBooking(@Body() bookingData: BookingRequest, @Req() req: Request) {
    // Add client ID from authenticated user
    bookingData.clientId = req.user.id;
    return this.bookingService.createBooking(bookingData);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details by ID' })
  @ApiResponse({ status: 200, description: 'Booking details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBooking(@Param('id') id: string, @Req() req: Request) {
    const booking = await this.bookingService.getBookingById(id);
    
    // Check if user has permission to view this booking
    if (booking.clientId !== req.user.id && booking.escortId !== req.user.id) {
      throw new Error('Unauthorized to view this booking');
    }
    
    return booking;
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  @ApiResponse({ status: 200, description: 'Booking status updated successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() updateData: {
      status: 'confirmed' | 'rejected' | 'cancelled';
      message?: string;
      alternativeTime?: string;
    },
    @Req() req: Request
  ) {
    const booking = await this.bookingService.getBookingById(id);
    
    // Verify user has permission to update this booking
    if (booking.escortId !== req.user.id) {
      throw new Error('Only the escort can update booking status');
    }
    
    return this.bookingService.updateBookingStatus(
      id,
      updateData.status,
      {
        message: updateData.message,
        alternativeTime: updateData.alternativeTime
      }
    );
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming bookings for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Upcoming bookings retrieved successfully' })
  async getUpcomingBookings(@Req() req: Request) {
    const role = req.user.role === 'escort' ? 'escort' : 'client';
    return this.bookingService.getUpcomingBookings(req.user.id, role);
  }
}