const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const aws = require('aws-sdk');
const { redis } = require('../config/database');

class EmailService {
    constructor() {
        // SMTP Setup für Entwicklung
        if (process.env.NODE_ENV === 'development') {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            // AWS SES für Produktion
            this.ses = new aws.SES({
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                region: process.env.AWS_REGION
            });

            this.transporter = nodemailer.createTransport({
                SES: this.ses
            });
        }

        // Email Templates laden
        this.templates = {
            welcome: pug.compileFile(`${__dirname}/../views/emails/welcome.pug`),
            passwordReset: pug.compileFile(`${__dirname}/../views/emails/passwordReset.pug`),
            bookingConfirmation: pug.compileFile(`${__dirname}/../views/emails/bookingConfirmation.pug`),
            verificationReminder: pug.compileFile(`${__dirname}/../views/emails/verificationReminder.pug`),
            newsletter: pug.compileFile(`${__dirname}/../views/emails/newsletter.pug`)
        };
    }

    // Email senden
    async send(options) {
        try {
            // Template rendern
            const html = this.templates[options.template]({
                ...options.data,
                year: new Date().getFullYear()
            });

            // Text-Version erstellen
            const text = htmlToText.fromString(html);

            // Email Optionen
            const mailOptions = {
                from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
                to: options.email,
                subject: options.subject,
                html,
                text
            };

            // Rate Limiting prüfen
            const rateLimitKey = `email_limit_${options.email}`;
            const sentCount = await redis.incr(rateLimitKey);
            if (sentCount === 1) {
                await redis.expire(rateLimitKey, 3600); // 1 Stunde
            }
            if (sentCount > 5) { // Max 5 Emails pro Stunde
                throw new Error('Rate limit exceeded');
            }

            // Email senden
            const info = await this.transporter.sendMail(mailOptions);

            // Email-Log speichern
            await redis.lpush('email_logs', JSON.stringify({
                to: options.email,
                template: options.template,
                timestamp: Date.now(),
                messageId: info.messageId
            }));

            return info;
        } catch (error) {
            console.error('Email send error:', error);
            throw error;
        }
    }

    // Willkommens-Email
    async sendWelcome(user) {
        await this.send({
            template: 'welcome',
            email: user.email,
            subject: 'Willkommen bei unserem Service',
            data: {
                name: user.profile.firstName || 'Geschätzter Kunde',
                verificationUrl: `${process.env.FRONTEND_URL}/verify/${user.verificationToken}`
            }
        });
    }

    // Passwort zurücksetzen
    async sendPasswordReset(user, resetToken) {
        await this.send({
            template: 'passwordReset',
            email: user.email,
            subject: 'Ihr Passwort zurücksetzen',
            data: {
                resetUrl: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`,
                validFor: '10 Minuten'
            }
        });
    }

    // Buchungsbestätigung
    async sendBookingConfirmation(booking) {
        const [client, escort] = await Promise.all([
            User.findById(booking.client),
            User.findById(booking.escort)
        ]);

        // Email an Kunden
        await this.send({
            template: 'bookingConfirmation',
            email: client.email,
            subject: 'Ihre Buchungsbestätigung',
            data: {
                bookingRef: booking._id,
                escortName: escort.profile.displayName,
                date: booking.startDate,
                duration: booking.duration,
                amount: booking.price.amount
            }
        });

        // Email an Escort
        await this.send({
            template: 'bookingConfirmation',
            email: escort.email,
            subject: 'Neue Buchung erhalten',
            data: {
                bookingRef: booking._id,
                clientName: client.profile.displayName,
                date: booking.startDate,
                duration: booking.duration,
                amount: booking.price.amount
            }
        });
    }

    // Verifizierungserinnerung
    async sendVerificationReminder(user) {
        await this.send({
            template: 'verificationReminder',
            email: user.email,
            subject: 'Bitte vervollständigen Sie Ihre Verifizierung',
            data: {
                name: user.profile.displayName,
                verificationUrl: `${process.env.FRONTEND_URL}/verify/${user.verificationToken}`
            }
        });
    }

    // Newsletter
    async sendNewsletter(subscribers, newsletter) {
        const batch = 100; // Emails pro Batch
        for (let i = 0; i < subscribers.length; i += batch) {
            const currentBatch = subscribers.slice(i, i + batch);
            await Promise.all(
                currentBatch.map(subscriber => 
                    this.send({
                        template: 'newsletter',
                        email: subscriber.email,
                        subject: newsletter.subject,
                        data: {
                            content: newsletter.content,
                            unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe/${subscriber.unsubscribeToken}`
                        }
                    })
                )
            );
            // Kurze Pause zwischen Batches
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

module.exports = new EmailService();