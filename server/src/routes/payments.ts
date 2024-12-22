import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { authorize } from '../middleware/authorize';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  getTransactionHistory,
  getPaymentDetails,
  refundPayment,
  createConnectedAccount,
  getAccountBalance,
  getPayoutHistory,
  withdrawFunds,
  updateBankInfo,
  getStripeAccountStatus,
} from '../controllers/payments';

const router = Router();

// Payment validation
const paymentIntentValidation = [
  body('booking_id').isUUID().withMessage('Invalid booking ID'),
  body('payment_method_id')
    .optional()
    .isString()
    .withMessage('Invalid payment method ID'),
  body('save_payment_method')
    .optional()
    .isBoolean()
    .withMessage('save_payment_method must be a boolean'),
];

// Payout validation
const payoutValidation = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .isIn(['USD', 'EUR', 'GBP']) // Add supported currencies
    .withMessage('Invalid currency'),
];

// Bank info validation
const bankInfoValidation = [
  body('account_holder_name')
    .isString()
    .notEmpty()
    .withMessage('Account holder name is required')
    .trim(),
  body('account_number')
    .isString()
    .notEmpty()
    .withMessage('Account number is required')
    .trim(),
  body('routing_number')
    .isString()
    .notEmpty()
    .withMessage('Routing number is required')
    .trim(),
  body('account_type')
    .isIn(['checking', 'savings'])
    .withMessage('Invalid account type'),
  body('currency')
    .isIn(['USD', 'EUR', 'GBP']) // Add supported currencies
    .withMessage('Invalid currency'),
  body('country')
    .isISO31661Alpha2()
    .withMessage('Invalid country code'),
];

// Routes

// Client payments
router.post(
  '/create-payment-intent',
  paymentIntentValidation,
  validateRequest,
  createPaymentIntent
);
router.post(
  '/confirm-payment/:paymentIntentId',
  confirmPayment
);
router.get('/payment-methods', getPaymentMethods);
router.post(
  '/payment-methods',
  body('payment_method_id')
    .isString()
    .withMessage('Invalid payment method ID'),
  validateRequest,
  addPaymentMethod
);
router.delete(
  '/payment-methods/:paymentMethodId',
  removePaymentMethod
);
router.post(
  '/payment-methods/:paymentMethodId/default',
  setDefaultPaymentMethod
);
router.get('/transactions', getTransactionHistory);
router.get('/transactions/:transactionId', getPaymentDetails);

// Provider payments
router.post(
  '/connected-account',
  authorize('provider'),
  createConnectedAccount
);
router.get(
  '/connected-account/status',
  authorize('provider'),
  getStripeAccountStatus
);
router.get(
  '/balance',
  authorize('provider'),
  getAccountBalance
);
router.get(
  '/payouts',
  authorize('provider'),
  getPayoutHistory
);
router.post(
  '/withdraw',
  authorize('provider'),
  payoutValidation,
  validateRequest,
  withdrawFunds
);
router.put(
  '/bank-info',
  authorize('provider'),
  bankInfoValidation,
  validateRequest,
  updateBankInfo
);

// Refunds (Admin only)
router.post(
  '/refund/:paymentId',
  authorize('admin'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be greater than or equal to 0'),
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Refund reason cannot exceed 500 characters')
    .trim(),
  validateRequest,
  refundPayment
);

export { router as paymentRouter };