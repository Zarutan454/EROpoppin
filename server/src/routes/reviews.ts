import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { authorize } from '../middleware/authorize';
import {
  createReview,
  getReview,
  updateReview,
  deleteReview,
  getProviderReviews,
  getUserReviews,
  likeReview,
  unlikeReview,
  reportReview,
  respondToReview,
  getReviewStatistics,
  moderateReview,
} from '../controllers/reviews';

const router = Router();

// Review validation
const reviewValidation = [
  body('booking_id').isUUID().withMessage('Invalid booking ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .isString()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters')
    .trim(),
  body('anonymous')
    .optional()
    .isBoolean()
    .withMessage('Anonymous must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .withMessage('Each tag must be a string'),
];

// Response validation
const responseValidation = [
  body('response')
    .isString()
    .notEmpty()
    .withMessage('Response is required')
    .isLength({ max: 500 })
    .withMessage('Response cannot exceed 500 characters')
    .trim(),
];

// Report validation
const reportValidation = [
  body('reason')
    .isString()
    .notEmpty()
    .withMessage('Report reason is required')
    .isLength({ max: 500 })
    .withMessage('Report reason cannot exceed 500 characters')
    .trim(),
  body('details')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Report details cannot exceed 1000 characters')
    .trim(),
];

// Moderation validation
const moderationValidation = [
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

// Routes

// Review management
router.post('/', reviewValidation, validateRequest, createReview);
router.get('/:id', getReview);
router.patch(
  '/:id',
  reviewValidation,
  validateRequest,
  updateReview
);
router.delete('/:id', deleteReview);

// Provider reviews
router.get('/provider/:providerId', getProviderReviews);
router.post(
  '/:id/respond',
  authorize('provider'),
  responseValidation,
  validateRequest,
  respondToReview
);
router.get(
  '/provider/statistics',
  authorize('provider'),
  getReviewStatistics
);

// User reviews
router.get('/user/reviews', getUserReviews);

// Review interactions
router.post('/:id/like', likeReview);
router.delete('/:id/like', unlikeReview);
router.post(
  '/:id/report',
  reportValidation,
  validateRequest,
  reportReview
);

// Admin moderation
router.post(
  '/:id/moderate',
  authorize('admin'),
  moderationValidation,
  validateRequest,
  moderateReview
);

export { router as reviewRouter };