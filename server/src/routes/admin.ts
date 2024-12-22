import { Router } from 'express';
import { body, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { authorize } from '../middleware/authorize';
import {
  getDashboardStats,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  suspendUser,
  activateUser,
  getBookings,
  getBooking,
  updateBooking,
  cancelBooking,
  getPayments,
  getPayment,
  refundPayment,
  getReviews,
  getReview,
  moderateReview,
  getReports,
  handleReport,
  getSystemLogs,
  getAuditTrail,
  updateSystemSettings,
  getSystemSettings,
  sendSystemNotification,
  exportData,
} from '../controllers/admin';

const router = Router();

// Ensure all routes require admin privileges
router.use(authorize('admin'));

// User management validation
const userUpdateValidation = [
  body('role')
    .optional()
    .isIn(['user', 'provider', 'admin'])
    .withMessage('Invalid role'),
  body('status')
    .optional()
    .isIn(['active', 'suspended', 'pending'])
    .withMessage('Invalid status'),
  body('verified')
    .optional()
    .isBoolean()
    .withMessage('Verified must be a boolean'),
];

// Booking update validation
const bookingUpdateValidation = [
  body('status')
    .optional()
    .isIn(['confirmed', 'cancelled', 'completed'])
    .withMessage('Invalid booking status'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
    .trim(),
];

// Review moderation validation
const reviewModerationValidation = [
  body('action')
    .isIn(['approve', 'reject', 'flag'])
    .withMessage('Invalid moderation action'),
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Moderation reason cannot exceed 500 characters')
    .trim(),
];

// Report handling validation
const reportHandlingValidation = [
  body('action')
    .isIn(['resolved', 'dismissed', 'escalated'])
    .withMessage('Invalid action'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
    .trim(),
];

// System settings validation
const systemSettingsValidation = [
  body('maintenance_mode')
    .optional()
    .isBoolean()
    .withMessage('maintenance_mode must be a boolean'),
  body('user_registration')
    .optional()
    .isBoolean()
    .withMessage('user_registration must be a boolean'),
  body('provider_registration')
    .optional()
    .isBoolean()
    .withMessage('provider_registration must be a boolean'),
  body('platform_fee')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Platform fee must be between 0 and 100'),
  body('minimum_payout')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum payout must be greater than 0'),
];

// System notification validation
const systemNotificationValidation = [
  body('title')
    .isString()
    .notEmpty()
    .withMessage('Notification title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters')
    .trim(),
  body('message')
    .isString()
    .notEmpty()
    .withMessage('Notification message is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
    .trim(),
  body('type')
    .isIn(['info', 'warning', 'error'])
    .withMessage('Invalid notification type'),
  body('target_users')
    .optional()
    .isArray()
    .withMessage('target_users must be an array'),
  body('target_roles')
    .optional()
    .isArray()
    .withMessage('target_roles must be an array'),
];

// Routes

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.patch(
  '/users/:id',
  userUpdateValidation,
  validateRequest,
  updateUser
);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/activate', activateUser);

// Booking management
router.get('/bookings', getBookings);
router.get('/bookings/:id', getBooking);
router.patch(
  '/bookings/:id',
  bookingUpdateValidation,
  validateRequest,
  updateBooking
);
router.post('/bookings/:id/cancel', cancelBooking);

// Payment management
router.get('/payments', getPayments);
router.get('/payments/:id', getPayment);
router.post('/payments/:id/refund', refundPayment);

// Review management
router.get('/reviews', getReviews);
router.get('/reviews/:id', getReview);
router.post(
  '/reviews/:id/moderate',
  reviewModerationValidation,
  validateRequest,
  moderateReview
);

// Report management
router.get('/reports', getReports);
router.post(
  '/reports/:id',
  reportHandlingValidation,
  validateRequest,
  handleReport
);

// System management
router.get('/logs', 
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  validateRequest,
  getSystemLogs
);
router.get('/audit-trail', 
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  validateRequest,
  getAuditTrail
);
router.get('/settings', getSystemSettings);
router.patch(
  '/settings',
  systemSettingsValidation,
  validateRequest,
  updateSystemSettings
);

// Notifications
router.post(
  '/notifications',
  systemNotificationValidation,
  validateRequest,
  sendSystemNotification
);

// Data export
router.get('/export/:type', exportData);

export { router as adminRouter };