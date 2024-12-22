import nodemailer from 'nodemailer';
import nodemailerSendgrid from 'nodemailer-sendgrid';
import path from 'path';
import ejs from 'ejs';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Create email transport based on environment
const createTransport = () => {
  if (process.env.NODE_ENV === 'production') {
    // Use SendGrid in production
    return nodemailer.createTransport(
      nodemailerSendgrid({
        apiKey: process.env.SENDGRID_API_KEY!,
      })
    );
  } else {
    // Use Ethereal (fake SMTP) in development
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_EMAIL,
        pass: process.env.ETHEREAL_PASSWORD,
      },
    });
  }
};

const transport = createTransport();

// Verify transport connection
transport.verify((error) => {
  if (error) {
    logger.error('Email transport error:', error);
  } else {
    logger.info('Email transport ready');
  }
});

// Load email template
const loadTemplate = async (template: string, context: Record<string, any>) => {
  try {
    const templatePath = path.join(
      __dirname,
      '../templates/emails',
      `${template}.ejs`
    );
    return await ejs.renderFile(templatePath, context);
  } catch (error) {
    logger.error('Email template error:', error);
    throw error;
  }
};

// Send email
export const sendEmail = async ({
  to,
  subject,
  template,
  context,
  attachments,
}: EmailOptions): Promise<void> => {
  try {
    const html = await loadTemplate(template, {
      ...context,
      baseUrl: process.env.CLIENT_URL,
    });

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
      attachments,
    };

    const info = await transport.sendMail(mailOptions);

    logger.info('Email sent:', {
      messageId: info.messageId,
      to,
      subject,
      template,
    });

    // Log preview URL in development
    if (process.env.NODE_ENV !== 'production' && info.preview) {
      logger.info('Email preview URL:', info.preview);
    }
  } catch (error) {
    logger.error('Send email error:', error);
    throw error;
  }
};

// Send batch emails
export const sendBatchEmails = async (
  emails: EmailOptions[]
): Promise<void> => {
  try {
    const batchSize = 50; // SendGrid recommended batch size
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      await Promise.all(batch.map((email) => sendEmail(email)));
      // Add delay between batches to avoid rate limits
      if (i + batchSize < emails.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    logger.error('Send batch emails error:', error);
    throw error;
  }
};

// Email templates
export const emailTemplates = {
  // Authentication emails
  verification: {
    subject: 'Verify your email address',
    template: 'verification',
  },
  resetPassword: {
    subject: 'Reset your password',
    template: 'reset-password',
  },
  passwordChanged: {
    subject: 'Your password has been changed',
    template: 'password-changed',
  },

  // Booking emails
  bookingConfirmation: {
    subject: 'Booking Confirmation',
    template: 'booking-confirmation',
  },
  bookingReminder: {
    subject: 'Upcoming Booking Reminder',
    template: 'booking-reminder',
  },
  bookingCancellation: {
    subject: 'Booking Cancelled',
    template: 'booking-cancellation',
  },
  bookingRescheduled: {
    subject: 'Booking Rescheduled',
    template: 'booking-rescheduled',
  },

  // Payment emails
  paymentConfirmation: {
    subject: 'Payment Confirmation',
    template: 'payment-confirmation',
  },
  paymentFailed: {
    subject: 'Payment Failed',
    template: 'payment-failed',
  },
  refundIssued: {
    subject: 'Refund Issued',
    template: 'refund-issued',
  },

  // Review emails
  newReview: {
    subject: 'New Review Received',
    template: 'new-review',
  },
  reviewResponse: {
    subject: 'Provider Responded to Your Review',
    template: 'review-response',
  },

  // Message emails
  newMessage: {
    subject: 'New Message Received',
    template: 'new-message',
  },
  messageDigest: {
    subject: 'Your Message Digest',
    template: 'message-digest',
  },

  // Account emails
  welcomeEmail: {
    subject: 'Welcome to our platform',
    template: 'welcome',
  },
  accountSuspended: {
    subject: 'Account Suspended',
    template: 'account-suspended',
  },
  accountReactivated: {
    subject: 'Account Reactivated',
    template: 'account-reactivated',
  },
};

export default {
  sendEmail,
  sendBatchEmails,
  emailTemplates,
};