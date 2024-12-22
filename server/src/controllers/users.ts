import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadFile, deleteFile } from '../services/storage';
import { sendNotification } from '../services/notifications';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { redis } from '../services/redis';

const prisma = new PrismaClient();

// Get user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        full_name: true,
        bio: true,
        avatar_url: true,
        phone: true,
        location: true,
        role: true,
        created_at: true,
        provider_profile: req.user.role === 'provider' ? {
          select: {
            title: true,
            description: true,
            hourly_rate: true,
            categories: true,
            languages: true,
            experience_years: true,
            rating: true,
            total_reviews: true,
            total_bookings: true,
          },
        } : false,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json(user);
  } catch (error) {
    logger.error('Get profile error:', error);
    throw error;
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  const { full_name, bio, phone, location } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        full_name,
        bio,
        phone,
        location,
      },
    });

    res.json(user);
  } catch (error) {
    logger.error('Update profile error:', error);
    throw error;
  }
};

// Update user avatar
export const updateAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }

    // Upload file to storage
    const filePath = `avatars/${req.user.id}/${req.file.originalname}`;
    const avatarUrl = await uploadFile(filePath, req.file.buffer);

    // Delete old avatar if exists
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatar_url: true },
    });

    if (user?.avatar_url) {
      await deleteFile(user.avatar_url);
    }

    // Update user avatar URL
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar_url: avatarUrl },
    });

    res.json({ avatar_url: updatedUser.avatar_url });
  } catch (error) {
    logger.error('Update avatar error:', error);
    throw error;
  }
};

// Get provider profile
export const getProviderProfile = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const provider = await prisma.user.findUnique({
      where: { id, role: 'provider' },
      select: {
        id: true,
        username: true,
        full_name: true,
        bio: true,
        avatar_url: true,
        location: true,
        provider_profile: {
          select: {
            title: true,
            description: true,
            hourly_rate: true,
            categories: true,
            languages: true,
            experience_years: true,
            rating: true,
            total_reviews: true,
            total_bookings: true,
            services: true,
            availability: true,
          },
        },
      },
    });

    if (!provider) {
      throw new ApiError(404, 'Provider not found');
    }

    const cacheKey = `provider:${id}:stats`;
    const cachedStats = await redis.get(cacheKey);
    let stats;

    if (cachedStats) {
      stats = JSON.parse(cachedStats);
    } else {
      stats = await prisma.booking.groupBy({
        by: ['status'],
        where: { provider_id: id },
        _count: true,
      });

      await redis.set(cacheKey, JSON.stringify(stats), 'EX', 3600); // Cache for 1 hour
    }

    res.json({ ...provider, stats });
  } catch (error) {
    logger.error('Get provider profile error:', error);
    throw error;
  }
};

// Update provider profile
export const updateProviderProfile = async (req: Request, res: Response) => {
  const {
    title,
    description,
    hourly_rate,
    categories,
    languages,
    experience_years,
  } = req.body;

  try {
    const provider = await prisma.providerProfile.upsert({
      where: { user_id: req.user.id },
      update: {
        title,
        description,
        hourly_rate,
        categories,
        languages,
        experience_years,
      },
      create: {
        user_id: req.user.id,
        title,
        description,
        hourly_rate,
        categories,
        languages,
        experience_years,
      },
    });

    res.json(provider);
  } catch (error) {
    logger.error('Update provider profile error:', error);
    throw error;
  }
};

// Get provider availability
export const getProviderAvailability = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const availability = await prisma.availability.findMany({
      where: { provider_id: id },
    });

    res.json(availability);
  } catch (error) {
    logger.error('Get provider availability error:', error);
    throw error;
  }
};

// Update provider availability
export const updateProviderAvailability = async (req: Request, res: Response) => {
  const { schedule } = req.body;

  try {
    // Delete existing availability
    await prisma.availability.deleteMany({
      where: { provider_id: req.user.id },
    });

    // Create new availability
    const availability = await prisma.availability.createMany({
      data: schedule.map((slot: any) => ({
        provider_id: req.user.id,
        ...slot,
      })),
    });

    res.json(availability);
  } catch (error) {
    logger.error('Update provider availability error:', error);
    throw error;
  }
};

// Get provider services
export const getProviderServices = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const services = await prisma.service.findMany({
      where: { provider_id: id },
    });

    res.json(services);
  } catch (error) {
    logger.error('Get provider services error:', error);
    throw error;
  }
};

// Update provider services
export const updateProviderServices = async (req: Request, res: Response) => {
  const { services } = req.body;

  try {
    // Delete existing services
    await prisma.service.deleteMany({
      where: { provider_id: req.user.id },
    });

    // Create new services
    const newServices = await prisma.service.createMany({
      data: services.map((service: any) => ({
        provider_id: req.user.id,
        ...service,
      })),
    });

    res.json(newServices);
  } catch (error) {
    logger.error('Update provider services error:', error);
    throw error;
  }
};

// Search providers
export const searchProviders = async (req: Request, res: Response) => {
  const {
    query,
    category,
    location,
    min_price,
    max_price,
    min_rating,
    languages,
    availability,
    page = 1,
    limit = 10,
  } = req.query;

  try {
    const where: any = {
      role: 'provider',
      provider_profile: {},
    };

    if (query) {
      where.OR = [
        { full_name: { contains: query as string, mode: 'insensitive' } },
        { username: { contains: query as string, mode: 'insensitive' } },
        {
          provider_profile: {
            title: { contains: query as string, mode: 'insensitive' },
          },
        },
      ];
    }

    if (category) {
      where.provider_profile.categories = { has: category as string };
    }

    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    if (min_price) {
      where.provider_profile.hourly_rate = {
        gte: parseFloat(min_price as string),
      };
    }

    if (max_price) {
      where.provider_profile.hourly_rate = {
        ...where.provider_profile.hourly_rate,
        lte: parseFloat(max_price as string),
      };
    }

    if (min_rating) {
      where.provider_profile.rating = {
        gte: parseFloat(min_rating as string),
      };
    }

    if (languages) {
      where.provider_profile.languages = {
        hasAny: (languages as string).split(','),
      };
    }

    if (availability) {
      where.availability = {
        some: {
          day: parseInt(availability as string),
          available: true,
        },
      };
    }

    const [providers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          full_name: true,
          avatar_url: true,
          location: true,
          provider_profile: {
            select: {
              title: true,
              hourly_rate: true,
              rating: true,
              total_reviews: true,
              categories: true,
              languages: true,
            },
          },
        },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        orderBy: { provider_profile: { rating: 'desc' } },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      providers,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Search providers error:', error);
    throw error;
  }
};

// Get provider reviews
export const getProviderReviews = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { provider_id: id },
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
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
      }),
      prisma.review.count({ where: { provider_id: id } }),
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

// Toggle favorite provider
export const toggleFavoriteProvider = async (req: Request, res: Response) => {
  const { providerId } = req.params;

  try {
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        user_id_provider_id: {
          user_id: req.user.id,
          provider_id: providerId,
        },
      },
    });

    if (existingFavorite) {
      await prisma.favorite.delete({
        where: {
          user_id_provider_id: {
            user_id: req.user.id,
            provider_id: providerId,
          },
        },
      });

      res.json({ message: 'Provider removed from favorites' });
    } else {
      await prisma.favorite.create({
        data: {
          user_id: req.user.id,
          provider_id: providerId,
        },
      });

      // Send notification to provider
      await sendNotification({
        user_id: providerId,
        title: 'New Favorite',
        message: 'Someone added you to their favorites!',
        type: 'favorite',
      });

      res.json({ message: 'Provider added to favorites' });
    }
  } catch (error) {
    logger.error('Toggle favorite provider error:', error);
    throw error;
  }
};

// Get favorite providers
export const getFavoriteProviders = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { user_id: req.user.id },
        include: {
          provider: {
            select: {
              id: true,
              username: true,
              full_name: true,
              avatar_url: true,
              location: true,
              provider_profile: {
                select: {
                  title: true,
                  hourly_rate: true,
                  rating: true,
                  total_reviews: true,
                },
              },
            },
          },
        },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
      }),
      prisma.favorite.count({ where: { user_id: req.user.id } }),
    ]);

    res.json({
      favorites: favorites.map((f) => f.provider),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Get favorite providers error:', error);
    throw error;
  }
};

// Update notification settings
export const updateNotificationSettings = async (req: Request, res: Response) => {
  const { email_notifications, push_notifications } = req.body;

  try {
    const settings = await prisma.notificationSettings.upsert({
      where: { user_id: req.user.id },
      update: {
        email_notifications,
        push_notifications,
      },
      create: {
        user_id: req.user.id,
        email_notifications,
        push_notifications,
      },
    });

    res.json(settings);
  } catch (error) {
    logger.error('Update notification settings error:', error);
    throw error;
  }
};

// Get notification settings
export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.notificationSettings.findUnique({
      where: { user_id: req.user.id },
    });

    res.json(settings || {
      email_notifications: true,
      push_notifications: true,
    });
  } catch (error) {
    logger.error('Get notification settings error:', error);
    throw error;
  }
};

// Delete account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    // Delete user data
    await Promise.all([
      prisma.favorite.deleteMany({ where: { user_id: req.user.id } }),
      prisma.notification.deleteMany({ where: { user_id: req.user.id } }),
      prisma.notificationSettings.delete({ where: { user_id: req.user.id } }),
      prisma.review.deleteMany({ where: { user_id: req.user.id } }),
      prisma.booking.deleteMany({ where: { user_id: req.user.id } }),
      prisma.message.deleteMany({ where: { sender_id: req.user.id } }),
      prisma.conversation.deleteMany({ where: { 
        OR: [
          { user1_id: req.user.id },
          { user2_id: req.user.id },
        ]
      }}),
    ]);

    if (req.user.role === 'provider') {
      await Promise.all([
        prisma.service.deleteMany({ where: { provider_id: req.user.id } }),
        prisma.availability.deleteMany({ where: { provider_id: req.user.id } }),
        prisma.providerProfile.delete({ where: { user_id: req.user.id } }),
      ]);
    }

    // Delete user
    await prisma.user.delete({ where: { id: req.user.id } });

    // Clear user sessions
    await redis.del(`refresh_token:${req.user.id}`);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Delete account error:', error);
    throw error;
  }
};