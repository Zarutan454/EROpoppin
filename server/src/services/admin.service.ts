import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Admin, AdminRole } from '../models/Admin';
import { User } from '../models/User';
import { Booking } from '../models/Booking';
import { Review } from '../models/Review';
import { RedisService } from './redis';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly redisService: RedisService
  ) {}

  // User Management
  async getAllUsers({ page, limit, search, status }: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }) {
    const query = this.userRepository.createQueryBuilder('user');

    if (search) {
      query.where('user.email LIKE :search OR user.username LIKE :search', {
        search: `%${search}%`
      });
    }

    if (status) {
      query.andWhere('user.status = :status', { status });
    }

    const [users, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: users,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit)
      }
    };
  }

  async getUser(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'bookings', 'reviews']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: string, userData: any) {
    const user = await this.getUser(id);
    Object.assign(user, userData);
    return this.userRepository.save(user);
  }

  async deleteUser(id: string) {
    const user = await this.getUser(id);
    await this.userRepository.remove(user);
  }

  // Booking Management
  async getAllBookings({ page, limit, status, startDate, endDate }: {
    page: number;
    limit: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = this.bookingRepository.createQueryBuilder('booking');

    if (status) {
      query.andWhere('booking.status = :status', { status });
    }

    if (startDate && endDate) {
      query.andWhere('booking.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      });
    }

    const [bookings, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: bookings,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit)
      }
    };
  }

  async getBooking(id: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user', 'escort']
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateBooking(id: string, bookingData: any) {
    const booking = await this.getBooking(id);
    Object.assign(booking, bookingData);
    return this.bookingRepository.save(booking);
  }

  // Content Moderation
  async getContentForModeration({ type, status }: {
    type?: string;
    status?: string;
  }) {
    // This could include reviews, images, or any other content that needs moderation
    const query = this.reviewRepository.createQueryBuilder('review')
      .where('review.isModerated = :isModerated', { isModerated: false });

    if (status) {
      query.andWhere('review.status = :status', { status });
    }

    return query.getMany();
  }

  async moderateContent(id: string, { action, reason }: {
    action: 'approve' | 'reject' | 'flag';
    reason?: string;
  }) {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Content not found');
    }

    review.isModerated = true;
    review.moderationAction = action;
    review.moderationReason = reason;
    review.moderatedAt = new Date();

    return this.reviewRepository.save(review);
  }

  // Statistics & Analytics
  async getStatistics({ startDate, endDate, type }: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }) {
    const stats: any = {};

    // User statistics
    stats.users = {
      total: await this.userRepository.count(),
      new: await this.userRepository.count({
        where: {
          createdAt: Between(startDate, endDate)
        }
      })
    };

    // Booking statistics
    stats.bookings = {
      total: await this.bookingRepository.count(),
      completed: await this.bookingRepository.count({
        where: { status: 'completed' }
      }),
      revenue: await this.bookingRepository
        .createQueryBuilder('booking')
        .where('booking.status = :status', { status: 'completed' })
        .select('SUM(booking.amount)', 'total')
        .getRawOne()
    };

    // Review statistics
    stats.reviews = {
      total: await this.reviewRepository.count(),
      pending: await this.reviewRepository.count({
        where: { isModerated: false }
      }),
      averageRating: await this.reviewRepository
        .createQueryBuilder('review')
        .select('AVG(review.rating)', 'average')
        .getRawOne()
    };

    return stats;
  }

  // System Settings
  async getSettings() {
    const settings = await this.redisService.get('system:settings');
    return settings || {};
  }

  async updateSettings(settings: any) {
    await this.redisService.set('system:settings', settings);
    return settings;
  }

  // Admin Management
  async getAllAdmins() {
    return this.adminRepository.find();
  }

  async createAdmin(adminData: Partial<Admin>) {
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const admin = this.adminRepository.create({
      ...adminData,
      password: hashedPassword
    });
    return this.adminRepository.save(admin);
  }

  async updateAdmin(id: string, adminData: Partial<Admin>) {
    const admin = await this.adminRepository.findOne({ where: { id } });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (adminData.password) {
      adminData.password = await bcrypt.hash(adminData.password, 10);
    }

    Object.assign(admin, adminData);
    return this.adminRepository.save(admin);
  }

  async deleteAdmin(id: string) {
    const admin = await this.adminRepository.findOne({ where: { id } });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (admin.role === AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot delete super admin');
    }

    await this.adminRepository.remove(admin);
  }

  // Activity Logs
  async getActivityLogs({ page, limit, type, startDate, endDate }: {
    page: number;
    limit: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = this.adminRepository
      .createQueryBuilder('admin')
      .select('admin.actions')
      .where('admin.actions IS NOT NULL');

    if (type) {
      query.andWhere("admin.actions @> :type", { type: `[{"action": "${type}"}]` });
    }

    if (startDate && endDate) {
      query.andWhere("admin.actions @> :dates", {
        dates: `[{"timestamp": {"$gte": "${startDate}", "$lte": "${endDate}"}}]`
      });
    }

    const [logs, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: logs.map(log => log.actions).flat(),
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit)
      }
    };
  }

  // Support Tickets
  async getSupportTickets({ status, priority }: {
    status?: string;
    priority?: string;
  }) {
    // This would be implemented when you have a support ticket system
    return [];
  }

  async updateSupportTicket(id: string, ticketData: any) {
    // This would be implemented when you have a support ticket system
    return {};
  }
}