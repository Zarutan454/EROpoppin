const webpush = require('web-push');
const User = require('../models/User');
const { redis } = require('../config/database');
const AWS = require('aws-sdk');

class NotificationService {
    constructor() {
        // Web Push Setup
        webpush.setVapidDetails(
            'mailto:' + process.env.VAPID_EMAIL,
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );

        // AWS SNS für Mobile Push
        this.sns = new AWS.SNS({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
        });
    }

    // Push-Subscription speichern
    async savePushSubscription(userId, subscription) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Benutzer nicht gefunden');
            }

            // Subscription in Redis speichern
            await redis.hset(
                `push_subscriptions_${userId}`,
                subscription.endpoint,
                JSON.stringify(subscription)
            );

            return true;
        } catch (error) {
            console.error('Push subscription error:', error);
            throw error;
        }
    }

    // Web Push Notification senden
    async sendWebPush(userId, notification) {
        try {
            // Subscriptions aus Redis holen
            const subscriptions = await redis.hgetall(`push_subscriptions_${userId}`);
            
            if (!subscriptions) return;

            const payload = JSON.stringify({
                title: notification.title,
                body: notification.body,
                icon: notification.icon,
                url: notification.url,
                timestamp: Date.now()
            });

            // An alle Subscriptions senden
            const promises = Object.values(subscriptions).map(async (sub) => {
                try {
                    const subscription = JSON.parse(sub);
                    await webpush.sendNotification(subscription, payload);
                } catch (error) {
                    if (error.statusCode === 410) {
                        // Subscription ist nicht mehr gültig - löschen
                        await redis.hdel(
                            `push_subscriptions_${userId}`,
                            subscription.endpoint
                        );
                    }
                    console.error('Push notification error:', error);
                }
            });

            await Promise.all(promises);
        } catch (error) {
            console.error('Send web push error:', error);
            throw error;
        }
    }

    // Mobile Push Notification senden
    async sendMobilePush(userId, notification) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.deviceToken) return;

            const params = {
                Message: JSON.stringify({
                    default: notification.body,
                    APNS: JSON.stringify({
                        aps: {
                            alert: {
                                title: notification.title,
                                body: notification.body
                            },
                            sound: 'default',
                            badge: 1
                        }
                    }),
                    FCM: JSON.stringify({
                        notification: {
                            title: notification.title,
                            body: notification.body
                        },
                        data: {
                            url: notification.url
                        }
                    })
                }),
                MessageStructure: 'json',
                TargetArn: user.deviceToken
            };

            await this.sns.publish(params).promise();
        } catch (error) {
            console.error('Send mobile push error:', error);
            throw error;
        }
    }

    // Benachrichtigung an Benutzer senden
    async notify(userId, notification) {
        try {
            // Web Push senden
            await this.sendWebPush(userId, notification);
            
            // Mobile Push senden
            await this.sendMobilePush(userId, notification);

            // Benachrichtigung in Datenbank speichern
            await this.saveNotification(userId, notification);
        } catch (error) {
            console.error('Notification error:', error);
            throw error;
        }
    }

    // Benachrichtigung in Datenbank speichern
    async saveNotification(userId, notification) {
        try {
            // In Redis für schnellen Zugriff
            await redis.lpush(
                `notifications_${userId}`,
                JSON.stringify({
                    ...notification,
                    timestamp: Date.now(),
                    read: false
                })
            );

            // Auf 100 Benachrichtigungen begrenzen
            await redis.ltrim(`notifications_${userId}`, 0, 99);
        } catch (error) {
            console.error('Save notification error:', error);
            throw error;
        }
    }

    // Benachrichtigungen abrufen
    async getNotifications(userId, page = 1, limit = 20) {
        try {
            const start = (page - 1) * limit;
            const end = start + limit - 1;

            const notifications = await redis.lrange(
                `notifications_${userId}`,
                start,
                end
            );

            return notifications.map(n => JSON.parse(n));
        } catch (error) {
            console.error('Get notifications error:', error);
            throw error;
        }
    }

    // Benachrichtigung als gelesen markieren
    async markAsRead(userId, notificationIds) {
        try {
            const notifications = await this.getNotifications(userId);
            
            const updatedNotifications = notifications.map(n => {
                if (notificationIds.includes(n.id)) {
                    return { ...n, read: true };
                }
                return n;
            });

            // Redis aktualisieren
            await redis.del(`notifications_${userId}`);
            for (const notification of updatedNotifications.reverse()) {
                await redis.lpush(
                    `notifications_${userId}`,
                    JSON.stringify(notification)
                );
            }
        } catch (error) {
            console.error('Mark as read error:', error);
            throw error;
        }
    }

    // Vordefinierte Benachrichtigungen
    async sendBookingNotification(booking) {
        const notification = {
            title: 'Neue Buchung',
            body: `Sie haben eine neue Buchung für ${booking.startDate}`,
            url: `/bookings/${booking._id}`,
            icon: '/icons/booking.png'
        };

        await this.notify(booking.escort, notification);
    }

    async sendMessageNotification(message) {
        const notification = {
            title: 'Neue Nachricht',
            body: `Sie haben eine neue Nachricht von ${message.sender.name}`,
            url: `/messages/${message._id}`,
            icon: '/icons/message.png'
        };

        await this.notify(message.recipient, notification);
    }

    async sendVerificationNotification(user) {
        const notification = {
            title: 'Verifizierung erforderlich',
            body: 'Bitte vervollständigen Sie Ihre Verifizierung',
            url: '/verification',
            icon: '/icons/verification.png'
        };

        await this.notify(user._id, notification);
    }
}

module.exports = new NotificationService();