import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { authorize } from '../middleware/authorize';
import {
  createBooking,
  getBooking,
  getUserBookings,
  getProviderBookings,
  updateBooking,
  cancelBooking,
  confirmBooking,
  rescheduleBooking,
  getBookingHistory,
  getUpcomingBookings,
  getPastBookings,
  getBookingStatistics,
} from '../controllers/bookings';

const router = Router();

// Booking validation
const bookingValidation = [
  body('provider_id').isUUID().withMessage('Invalid provider ID'),
  body('service_id')
    .optional()
    .isUUID()
    .withMessage('Invalid service ID'),
  body('start_time')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('duration')
    .isInt({ min: 15 })
    .withMessage('Duration must be at least 15 minutes'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
    .trim(),
  body('extras')
    .optional()
    .isArray()
    .withMessage('Extras must be an array'),
  body('extras.*')
    .optional()
    .isUUID()
    .withMessage('Invalid extra ID'),
];

// Reschedule validation
const rescheduleValidation = [
  body('new_start_time')
    .isISO8601()
    .withMessage('New start time must be a valid ISO 8601 date'),
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
    .trim(),
];

// Cancel validation
const cancelValidation = [
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
    .trim(),
];

// Routes
router.post('/', bookingValidation, validateRequest, createBooking);
router.get('/:id', getBooking);
router.get('/user/upcoming', getUpcomingBookings);
router.get('/user/past', getPastBookings);
router.get('/user/history', getBookingHistory);
router.get('/user/statistics', getBookingStatistics);

// Provider routes
router.get(
  '/provider/bookings',
  authorize('provider'),
  getProviderBookings
);
router.get(
  '/provider/statistics',
  authorize('provider'),
  getBookingStatistics
);

// Booking management
router.patch(
  '/:id',
  authorize(['provider', 'admin']),
  bookingValidation,
  validateRequest,
  updateBooking
);
router.post(
  '/:id/cancel',
  cancelValidation,
  validateRequest,
  cancelBooking
);
router.post(
  '/:id/confirm',
  authorize('provider'),
  confirmBooking
);
router.post(
  '/:id/reschedule',
  rescheduleValidation,
  validateRequest,
  rescheduleBooking
);

export { router as bookingRouter };