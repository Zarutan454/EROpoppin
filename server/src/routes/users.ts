import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { validateRequest } from '../middleware/validateRequest';
import { authorize } from '../middleware/authorize';
import { 
  getProfile,
  updateProfile,
  updateAvatar,
  getProviderProfile,
  updateProviderProfile,
  getProviderAvailability,
  updateProviderAvailability,
  getProviderServices,
  updateProviderServices,
  getProviderReviews,
  searchProviders,
  toggleFavoriteProvider,
  getFavoriteProviders,
  updateNotificationSettings,
  getNotificationSettings,
  deleteAccount
} from '../controllers/users';

const router = Router();

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  },
});

// Profile validation
const profileValidation = [
  body('full_name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long')
    .trim()
    .escape(),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
    .trim(),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-]+$/)
    .withMessage('Please enter a valid phone number'),
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be a valid object'),
  body('location.city')
    .optional()
    .isString()
    .trim(),
  body('location.country')
    .optional()
    .isString()
    .trim(),
];

// Provider profile validation
const providerProfileValidation = [
  ...profileValidation,
  body('title')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .trim(),
  body('hourly_rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array'),
  body('experience_years')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience years must be a positive number'),
];

// Service validation
const serviceValidation = [
  body('services.*.name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Service name must be between 3 and 100 characters')
    .trim(),
  body('services.*.description')
    .isLength({ min: 10, max: 500 })
    .withMessage('Service description must be between 10 and 500 characters')
    .trim(),
  body('services.*.price')
    .isFloat({ min: 0 })
    .withMessage('Service price must be a positive number'),
  body('services.*.duration')
    .isInt({ min: 15 })
    .withMessage('Service duration must be at least 15 minutes'),
];

// Availability validation
const availabilityValidation = [
  body('schedule.*.day')
    .isInt({ min: 0, max: 6 })
    .withMessage('Day must be between 0 and 6'),
  body('schedule.*.start')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format'),
  body('schedule.*.end')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format'),
  body('schedule.*.available')
    .isBoolean()
    .withMessage('Available must be a boolean'),
];

// Routes
router.get('/profile', getProfile);
router.patch('/profile', profileValidation, validateRequest, updateProfile);
router.patch('/avatar', upload.single('avatar'), updateAvatar);

// Provider routes
router.get('/providers/:id', getProviderProfile);
router.patch(
  '/providers/profile',
  authorize('provider'),
  providerProfileValidation,
  validateRequest,
  updateProviderProfile
);
router.get('/providers/:id/availability', getProviderAvailability);
router.patch(
  '/providers/availability',
  authorize('provider'),
  availabilityValidation,
  validateRequest,
  updateProviderAvailability
);
router.get('/providers/:id/services', getProviderServices);
router.patch(
  '/providers/services',
  authorize('provider'),
  serviceValidation,
  validateRequest,
  updateProviderServices
);
router.get('/providers/:id/reviews', getProviderReviews);
router.get('/providers/search', searchProviders);

// Favorite providers
router.post('/favorites/:providerId', toggleFavoriteProvider);
router.get('/favorites', getFavoriteProviders);

// Notification settings
router.get('/notifications/settings', getNotificationSettings);
router.patch(
  '/notifications/settings',
  body('email_notifications').isBoolean(),
  body('push_notifications').isBoolean(),
  validateRequest,
  updateNotificationSettings
);

// Account deletion
router.delete('/account', deleteAccount);

export { router as userRouter };