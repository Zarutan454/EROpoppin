import admin from 'firebase-admin';
import { prisma } from '../db';
import { logger } from '../utils/logger';
import { emitToUser } from './websocket';
import { sendEmail } from './email';
import { redis } from './redis';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

interface NotificationOptions {
  user_id: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, any>;
  priority?: 'high' | 'normal';
  image_url?: string;
}

// Send notification
export const sendNotification = async ({
  user_id,
  title,
  message,
  type,
  data = {},
  priority = 'high',
  image_url,
}: NotificationOptions): Promise<void> => {
  try {
    // Get user's notification settings
    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: {
        fcm_token: true,
        notification_settings: true,
        email: true,
        username: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        user_id,
        title,
        message,
        type,
        data,
        read: false,
      },
    });

    // Send real-time notification via WebSocket
    emitToUser(user_id, 'notification', {
      id: notification.id,
      title,
      message,
      type,
      data,
      created_at: notification.created_at,
    });

    // Send push notification if enabled
    if (
      user.notification_settings?.push_notifications &&
      user.fcm_token
    ) {
      await admin.messaging().send({
        token: user.fcm_token,
        notification: {
          title,
          body: message,
          ...(image_url && { imageUrl: image_url }),
        },
        data: {
          type,
          notification_id: notification.id,
          ...data,
        },
        android: {
          priority,
          notification: {
            channelId: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              'mutable-content': 1,
              sound: 'default',
            },
          },
        },
      });
    }

    // Send email notification if enabled
    if (user.notification_settings?.email_notifications) {
      // Use rate limiting for email notifications
      const emailRateKey = `email_rate:${user_id}`;
      const emailsSent = await redis.incr(emailRateKey);

      if (emailsSent === 1) {
        // Set expiry for rate limiting (e.g., 1 hour)
        await redis.expire(emailRateKey, 3600);
      }

      // Only send email if under rate limit
      if (emailsSent <= 5) { // Max 5 emails per hour
        await sendEmail({
          to: user.email,
          subject: title,
          template: 'notification',
          context: {
            username: user.username,
            title,
            message,
            type,
            actionUrl: data.action_url,
          },
        });
      }
    }
  } catch (error) {
    logger.error('Send notification error:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (
  notification_id: string,
  user_id: string
): Promise<void> => {
  try {
    await prisma.notification.update({
      where: {
        id: notification_id,
        user_id,
      },
      data: {
        read: true,
        read_at: new Date(),
      },
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (
  user_id: string
): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: {
        user_id,
        read: false,
      },
      data: {
        read: true,
        read_at: new Date(),
      },
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    throw error;
  }
};

// Get unread notifications count
export const getUnreadNotificationsCount = async (
  user_id: string
): Promise<number> => {
  try {
    return await prisma.notification.count({
      where: {
        user_id,
        read: false,
      },
    });
  } catch (error) {
    logger.error('Get unread notifications count error:', error);
    throw error;
  }
};

// Update FCM token
export const updateFCMToken = async (
  user_id: string,
  fcm_token: string
): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: user_id },
      data: { fcm_token },
    });
  } catch (error) {
    logger.error('Update FCM token error:', error);
    throw error;
  }
};

// Send batch notifications
export const sendBatchNotifications = async (
  notifications: NotificationOptions[]
): Promise<void> => {
  try {
    const batchSize = 500; // Firebase recommended batch size
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      await Promise.all(batch.map((notification) => sendNotification(notification)));
    }
  } catch (error) {
    logger.error('Send batch notifications error:', error);
    throw error;
  }
};

// Delete old notifications
export const deleteOldNotifications = async (
  days: number = 30
): Promise<void> => {
  try {
    const date = new Date();
    date.setDate(date.getDate() - days);

    await prisma.notification.deleteMany({
      where: {
        created_at: {
          lt: date,
        },
        read: true,
      },
    });
  } catch (error) {
    logger.error('Delete old notifications error:', error);
    throw error;
  }
};

export default {
  sendNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
  updateFCMToken,
  sendBatchNotifications,
  deleteOldNotifications,
};