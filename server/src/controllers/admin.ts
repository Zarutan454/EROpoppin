import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { sendNotification } from '../services/notifications';
import { sendEmail } from '../services/email';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { redis } from '../services/redis';
import { exportToCSV, exportToPDF } from '../utils/export';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Get dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      userStats,
      bookingStats,
      revenueStats,
      reportStats,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.booking.groupBy({
        by: ['status'],
        _count: true,
        _sum: {
          price: true,
        },
      }),
      prisma.$queryRaw`
        SELECT DATE_TRUNC('month', created_at) as month,
               COUNT(*) as booking_count,
               SUM(price) as revenue
        FROM bookings
        WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `,
      prisma.$queryRaw`
        SELECT type,
               status,
               COUNT(*) as count
        FROM reports
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY type, status
      `,
    ]);

    res.json({
      users: {
        total: userStats.reduce((sum, stat) => sum + stat._count, 0),
        byRole: userStats.reduce((acc, stat) => {
          acc[stat.role] = stat._count;
          return acc;
        }, {}),
      },
      bookings: {
        total: bookingStats.reduce((sum, stat) => sum + stat._count, 0),
        byStatus: bookingStats.reduce((acc, stat) => {
          acc[stat.status] = { count: stat._count, revenue: stat._sum.price };
          return acc;
        }, {}),
      },
      revenue: revenueStats,
      reports: reportStats,
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    throw error;
  }
};

// Get users
export const getUsers = async (req: Request, res: Response) => {
  const {
    role,
    status,
    search,
    sort = 'created_at',
    order = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  try {
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { username: { contains: search as string, mode: 'insensitive' } },
        { full_name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          full_name: true,
          avatar_url: true,
          role: true,
          status: true,
          created_at: true,
          last_login: true,
          provider_profile: true,
        },
        orderBy: { [sort as string]: order },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Get users error:', error);
    throw error;
  }
};

// Get user
export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        provider_profile: true,
        bookings: {
          orderBy: { created_at: 'desc' },
          take: 5,
          include: {
            provider: {
              select: {
                id: true,
                username: true,
                full_name: true,
              },
            },
          },
        },
        reviews: {
          orderBy: { created_at: 'desc' },
          take: 5,
          include: {
            provider: {
              select: {
                id: true,
                username: true,
                full_name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json(user);
  } catch (error) {
    logger.error('Get user error:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, status, verified } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        role,
        status,
        verified,
      },
    });

    // Send notification
    await Promise.all([
      sendNotification({
        user_id: id,
        title: 'Account Updated',
        message: `Your account status has been updated by an administrator`,
        type: 'account',
      }),
      sendEmail({
        to: user.email,
        subject: 'Account Status Updated',
        template: 'account-update',
        context: {
          name: user.full_name,
          status,
          role,
        },
      }),
    ]);

    res.json(user);
  } catch (error) {
    logger.error('Update user error:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        provider_profile: true,
        stripe_account: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Delete Stripe accounts if they exist
    if (user.stripe_customer_id) {
      await stripe.customers.del(user.stripe_customer_id);
    }

    if (user.stripe_account?.account_id) {
      await stripe.accounts.del(user.stripe_account.account_id);
    }

    // Delete user data
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { sender_id: id } }),
      prisma.conversation.deleteMany({
        where: {
          OR: [{ user1_id: id }, { user2_id: id }],
        },
      }),
      prisma.review.deleteMany({ where: { user_id: id } }),
      prisma.booking.deleteMany({
        where: {
          OR: [{ user_id: id }, { provider_id: id }],
        },
      }),
      prisma.notification.deleteMany({ where: { user_id: id } }),
      prisma.providerProfile.deleteMany({ where: { user_id: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    throw error;
  }
};

// Suspend user
export const suspendUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        status: 'suspended',
      },
    });

    await Promise.all([
      sendNotification({
        user_id: id,
        title: 'Account Suspended',
        message: 'Your account has been suspended by an administrator',
        type: 'account',
      }),
      sendEmail({
        to: user.email,
        subject: 'Account Suspended',
        template: 'account-suspended',
        context: {
          name: user.full_name,
        },
      }),
    ]);

    res.json(user);
  } catch (error) {
    logger.error('Suspend user error:', error);
    throw error;
  }
};

// Activate user
export const activateUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        status: 'active',
      },
    });

    await Promise.all([
      sendNotification({
        user_id: id,
        title: 'Account Activated',
        message: 'Your account has been activated',
        type: 'account',
      }),
      sendEmail({
        to: user.email,
        subject: 'Account Activated',
        template: 'account-activated',
        context: {
          name: user.full_name,
        },
      }),
    ]);

    res.json(user);
  } catch (error) {
    logger.error('Activate user error:', error);
    throw error;
  }
};

// Get bookings
export const getBookings = async (req: Request, res: Response) => {
  const {
    status,
    start_date,
    end_date,
    sort = 'created_at',
    order = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  try {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (start_date) {
      where.created_at = {
        ...where.created_at,
        gte: new Date(start_date as string),
      };
    }

    if (end_date) {
      where.created_at = {
        ...where.created_at,
        lte: new Date(end_date as string),
      };
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
            },
          },
          provider: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
          service: true,
        },
        orderBy: { [sort as string]: order },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      bookings,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Get bookings error:', error);
    throw error;
  }
};

// Get reviews
export const getReviews = async (req: Request, res: Response) => {
  const {
    status,
    rating,
    sort = 'created_at',
    order = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  try {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (rating) {
      where.rating = parseInt(rating as string);
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
          provider: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
          booking: true,
        },
        orderBy: { [sort as string]: order },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.review.count({ where }),
    ]);

    res.json({
      reviews,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Get reviews error:', error);
    throw error;
  }
};

// Get reports
export const getReports = async (req: Request, res: Response) => {
  const {
    type,
    status,
    sort = 'created_at',
    order = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  try {
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
          reported_user: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
        },
        orderBy: { [sort as string]: order },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.report.count({ where }),
    ]);

    res.json({
      reports,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Get reports error:', error);
    throw error;
  }
};

// Handle report
export const handleReport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, notes } = req.body;

  try {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            email: true,
            full_name: true,
          },
        },
      },
    });

    if (!report) {
      throw new ApiError(404, 'Report not found');
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: action,
        admin_notes: notes,
        resolved_at: new Date(),
        resolved_by: req.user.id,
      },
    });

    // Notify reporter
    await Promise.all([
      sendNotification({
        user_id: report.reporter_id,
        title: 'Report Updated',
        message: `Your report has been ${action}`,
        type: 'report',
        data: { report_id: report.id },
      }),
      sendEmail({
        to: report.reporter.email,
        subject: 'Report Status Updated',
        template: 'report-update',
        context: {
          name: report.reporter.full_name,
          action,
          notes,
        },
      }),
    ]);

    res.json(updatedReport);
  } catch (error) {
    logger.error('Handle report error:', error);
    throw error;
  }
};

// Get system logs
export const getSystemLogs = async (req: Request, res: Response) => {
  const { start_date, end_date, level, page = 1, limit = 50 } = req.query;

  try {
    const logs = await prisma.systemLog.findMany({
      where: {
        ...(start_date && {
          timestamp: {
            gte: new Date(start_date as string),
          },
        }),
        ...(end_date && {
          timestamp: {
            lte: new Date(end_date as string),
          },
        }),
        ...(level && { level: level as string }),
      },
      orderBy: { timestamp: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });

    res.json(logs);
  } catch (error) {
    logger.error('Get system logs error:', error);
    throw error;
  }
};

// Get audit trail
export const getAuditTrail = async (req: Request, res: Response) => {
  const {
    user_id,
    action_type,
    start_date,
    end_date,
    page = 1,
    limit = 50,
  } = req.query;

  try {
    const where: any = {};

    if (user_id) {
      where.user_id = user_id;
    }

    if (action_type) {
      where.action_type = action_type;
    }

    if (start_date) {
      where.timestamp = {
        ...where.timestamp,
        gte: new Date(start_date as string),
      };
    }

    if (end_date) {
      where.timestamp = {
        ...where.timestamp,
        lte: new Date(end_date as string),
      };
    }

    const [audits, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      audits,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Get audit trail error:', error);
    throw error;
  }
};

// Update system settings
export const updateSystemSettings = async (req: Request, res: Response) => {
  const {
    maintenance_mode,
    user_registration,
    provider_registration,
    platform_fee,
    minimum_payout,
  } = req.body;

  try {
    const settings = await prisma.systemSettings.update({
      where: { id: 1 }, // Assuming there's only one settings record
      data: {
        maintenance_mode,
        user_registration,
        provider_registration,
        platform_fee,
        minimum_payout,
        updated_at: new Date(),
        updated_by: req.user.id,
      },
    });

    // Clear cached settings
    await redis.del('system_settings');

    res.json(settings);
  } catch (error) {
    logger.error('Update system settings error:', error);
    throw error;
  }
};

// Get system settings
export const getSystemSettings = async (req: Request, res: Response) => {
  try {
    // Try to get cached settings
    const cachedSettings = await redis.get('system_settings');
    if (cachedSettings) {
      return res.json(JSON.parse(cachedSettings));
    }

    const settings = await prisma.systemSettings.findUnique({
      where: { id: 1 },
    });

    // Cache settings for 1 hour
    await redis.set(
      'system_settings',
      JSON.stringify(settings),
      'EX',
      60 * 60
    );

    res.json(settings);
  } catch (error) {
    logger.error('Get system settings error:', error);
    throw error;
  }
};

// Send system notification
export const sendSystemNotification = async (req: Request, res: Response) => {
  const { title, message, type, target_users, target_roles } = req.body;

  try {
    let users = [];

    if (target_users && target_users.length > 0) {
      users = await prisma.user.findMany({
        where: {
          id: { in: target_users },
        },
      });
    } else if (target_roles && target_roles.length > 0) {
      users = await prisma.user.findMany({
        where: {
          role: { in: target_roles },
        },
      });
    } else {
      users = await prisma.user.findMany();
    }

    // Send notifications in batches
    const batchSize = 100;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.all(
        batch.map((user) =>
          Promise.all([
            sendNotification({
              user_id: user.id,
              title,
              message,
              type,
            }),
            user.email_notifications &&
              sendEmail({
                to: user.email,
                subject: title,
                template: 'system-notification',
                context: {
                  name: user.full_name,
                  title,
                  message,
                },
              }),
          ])
        )
      );
    }

    res.json({
      message: `Notification sent to ${users.length} users`,
    });
  } catch (error) {
    logger.error('Send system notification error:', error);
    throw error;
  }
};

// Export data
export const exportData = async (req: Request, res: Response) => {
  const { type } = req.params;
  const { format = 'csv', start_date, end_date } = req.query;

  try {
    let data;
    const where: any = {};

    if (start_date) {
      where.created_at = {
        ...where.created_at,
        gte: new Date(start_date as string),
      };
    }

    if (end_date) {
      where.created_at = {
        ...where.created_at,
        lte: new Date(end_date as string),
      };
    }

    switch (type) {
      case 'users':
        data = await prisma.user.findMany({
          where,
          include: {
            provider_profile: true,
          },
        });
        break;

      case 'bookings':
        data = await prisma.booking.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                full_name: true,
              },
            },
            provider: {
              select: {
                id: true,
                email: true,
                full_name: true,
              },
            },
            service: true,
          },
        });
        break;

      case 'reviews':
        data = await prisma.review.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                full_name: true,
              },
            },
            provider: {
              select: {
                id: true,
                email: true,
                full_name: true,
              },
            },
            booking: true,
          },
        });
        break;

      case 'transactions':
        data = await prisma.booking.findMany({
          where: {
            ...where,
            payment_status: 'paid',
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                full_name: true,
              },
            },
            provider: {
              select: {
                id: true,
                email: true,
                full_name: true,
              },
            },
          },
        });
        break;

      default:
        throw new ApiError(400, 'Invalid export type');
    }

    let result;
    if (format === 'csv') {
      result = await exportToCSV(data, type);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${type}-${new Date().toISOString()}.csv`
      );
    } else if (format === 'pdf') {
      result = await exportToPDF(data, type);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${type}-${new Date().toISOString()}.pdf`
      );
    } else {
      throw new ApiError(400, 'Invalid export format');
    }

    res.send(result);
  } catch (error) {
    logger.error('Export data error:', error);
    throw error;
  }
};