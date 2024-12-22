import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Profile, ProfileStatus } from '../models/Profile';
import { RedisService } from './redis';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly redisService: RedisService
  ) {}

  async findAll({ status, page = 1, limit = 10 }: { status?: ProfileStatus; page?: number; limit?: number }) {
    const query = this.profileRepository.createQueryBuilder('profile');
    
    if (status) {
      query.where('profile.status = :status', { status });
    }

    const [profiles, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: profiles,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit)
      }
    };
  }

  async findById(id: string) {
    const profile = await this.profileRepository.findOne({
      where: { id }
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Increment view count
    await this.incrementStats(id, 'views');

    return profile;
  }

  async create(data: Partial<Profile>) {
    const profile = this.profileRepository.create({
      ...data,
      stats: {
        views: 0,
        bookings: 0,
        rating: 0,
        ratingCount: 0,
        responseRate: 100,
        responseTime: 0
      }
    });

    return this.profileRepository.save(profile);
  }

  async update(id: string, userId: string, data: Partial<Profile>) {
    const profile = await this.findById(id);
    
    if (profile.userId !== userId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Don't allow direct modification of stats
    delete data.stats;

    Object.assign(profile, data);
    return this.profileRepository.save(profile);
  }

  async delete(id: string, userId: string) {
    const profile = await this.findById(id);
    
    if (profile.userId !== userId) {
      throw new ForbiddenException('You can only delete your own profile');
    }

    await this.profileRepository.remove(profile);
  }

  async addImages(id: string, userId: string, images: Array<Partial<Profile['images'][0]>>) {
    const profile = await this.findById(id);
    
    if (profile.userId !== userId) {
      throw new ForbiddenException('You can only add images to your own profile');
    }

    profile.images = [
      ...profile.images,
      ...images.map((image, index) => ({
        id: Math.random().toString(36).substr(2, 9), // Simple ID generation
        ...image,
        order: profile.images.length + index
      }))
    ];

    return this.profileRepository.save(profile);
  }

  async deleteImage(id: string, userId: string, imageId: string) {
    const profile = await this.findById(id);
    
    if (profile.userId !== userId) {
      throw new ForbiddenException('You can only delete images from your own profile');
    }

    profile.images = profile.images.filter(img => img.id !== imageId);
    return this.profileRepository.save(profile);
  }

  async reorderImages(id: string, userId: string, orderData: { imageId: string; order: number }[]) {
    const profile = await this.findById(id);
    
    if (profile.userId !== userId) {
      throw new ForbiddenException('You can only reorder images in your own profile');
    }

    profile.images = profile.images.map(image => {
      const newOrder = orderData.find(od => od.imageId === image.id);
      return newOrder ? { ...image, order: newOrder.order } : image;
    });

    return this.profileRepository.save(profile);
  }

  async updateAvailability(id: string, userId: string, availabilityData: Profile['availability']) {
    const profile = await this.findById(id);
    
    if (profile.userId !== userId) {
      throw new ForbiddenException('You can only update availability for your own profile');
    }

    profile.availability = availabilityData;
    return this.profileRepository.save(profile);
  }

  async updateServices(id: string, userId: string, servicesData: Profile['services']) {
    const profile = await this.findById(id);
    
    if (profile.userId !== userId) {
      throw new ForbiddenException('You can only update services for your own profile');
    }

    profile.services = servicesData;
    return this.profileRepository.save(profile);
  }

  async updatePreferences(id: string, userId: string, preferencesData: Profile['preferences']) {
    const profile = await this.findById(id);
    
    if (profile.userId !== userId) {
      throw new ForbiddenException('You can only update preferences for your own profile');
    }

    profile.preferences = preferencesData;
    return this.profileRepository.save(profile);
  }

  async getStats(id: string, { startDate, endDate }: { startDate?: string; endDate?: string }) {
    const profile = await this.findById(id);
    
    // Basic stats from profile
    const stats = { ...profile.stats };

    // If date range is provided, get additional booking statistics
    if (startDate && endDate) {
      const bookings = await this.profileRepository
        .createQueryBuilder('profile')
        .leftJoinAndSelect('profile.bookings', 'booking')
        .where('profile.id = :id', { id })
        .andWhere('booking.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .getOne();

      if (bookings) {
        stats['periodBookings'] = bookings.bookings.length;
        stats['periodRevenue'] = bookings.bookings.reduce(
          (sum, booking) => sum + (booking.amount || 0),
          0
        );
      }
    }

    return stats;
  }

  private async incrementStats(id: string, field: keyof Profile['stats']) {
    const key = `profile:${id}:stats:${field}`;
    await this.redisService.incr(key);

    // Every 10 minutes, sync Redis stats to database
    const shouldSync = Math.random() < 0.1; // 10% chance
    if (shouldSync) {
      const value = await this.redisService.get(key);
      if (value) {
        await this.profileRepository.update(id, {
          stats: {
            [field]: parseInt(value, 10)
          }
        });
        await this.redisService.del(key);
      }
    }
  }
}