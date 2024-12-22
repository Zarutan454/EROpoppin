import Stripe from 'stripe';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const setupStripe = () => {
  // Configure webhook tolerance
  const webhookTolerance = parseInt(process.env.STRIPE_WEBHOOK_TOLERANCE || '300');
  stripe.webhooks.signature.EXPECTED_SCHEME = 'v1';
  stripe.webhooks.signature.TOLERANCE = webhookTolerance;

  logger.info('Stripe service initialized');
};

// Create customer
export const createCustomer = async (
  email: string,
  metadata: Record<string, string> = {}
) => {
  try {
    return await stripe.customers.create({
      email,
      metadata,
    });
  } catch (error) {
    logger.error('Create Stripe customer error:', error);
    throw error;
  }
};

// Create connected account
export const createConnectedAccount = async (
  email: string,
  country: string,
  metadata: Record<string, string> = {}
) => {
  try {
    return await stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata,
    });
  } catch (error) {
    logger.error('Create Stripe connected account error:', error);
    throw error;
  }
};

// Create account link
export const createAccountLink = async (
  accountId: string,
  refreshUrl: string,
  returnUrl: string
) => {
  try {
    return await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
  } catch (error) {
    logger.error('Create Stripe account link error:', error);
    throw error;
  }
};

// Create payment intent
export const createPaymentIntent = async (
  amount: number,
  currency: string,
  customerId: string,
  paymentMethodId?: string,
  metadata: Record<string, string> = {}
) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: !!paymentMethodId,
      metadata,
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Create payment intent error:', error);
    throw error;
  }
};

// Confirm payment intent
export const confirmPaymentIntent = async (
  paymentIntentId: string,
  paymentMethodId: string
) => {
  try {
    return await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
  } catch (error) {
    logger.error('Confirm payment intent error:', error);
    throw error;
  }
};

// Create refund
export const createRefund = async (
  paymentIntentId: string,
  amount?: number,
  metadata: Record<string, string> = {}
) => {
  try {
    return await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      metadata,
    });
  } catch (error) {
    logger.error('Create refund error:', error);
    throw error;
  }
};

// Create transfer
export const createTransfer = async (
  amount: number,
  destinationAccountId: string,
  metadata: Record<string, string> = {}
) => {
  try {
    return await stripe.transfers.create({
      amount,
      currency: 'usd',
      destination: destinationAccountId,
      metadata,
    });
  } catch (error) {
    logger.error('Create transfer error:', error);
    throw error;
  }
};

// Create payout
export const createPayout = async (
  amount: number,
  accountId: string,
  metadata: Record<string, string> = {}
) => {
  try {
    return await stripe.payouts.create(
      {
        amount,
        currency: 'usd',
        metadata,
      },
      {
        stripeAccount: accountId,
      }
    );
  } catch (error) {
    logger.error('Create payout error:', error);
    throw error;
  }
};

// Verify webhook signature
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string
) => {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    logger.error('Verify webhook signature error:', error);
    throw error;
  }
};

// Get account balance
export const getAccountBalance = async (accountId: string) => {
  try {
    return await stripe.balance.retrieve({
      stripeAccount: accountId,
    });
  } catch (error) {
    logger.error('Get account balance error:', error);
    throw error;
  }
};

// Get payment method
export const getPaymentMethod = async (paymentMethodId: string) => {
  try {
    return await stripe.paymentMethods.retrieve(paymentMethodId);
  } catch (error) {
    logger.error('Get payment method error:', error);
    throw error;
  }
};

// List payment methods
export const listPaymentMethods = async (
  customerId: string,
  type: string = 'card',
  limit: number = 10
) => {
  try {
    return await stripe.paymentMethods.list({
      customer: customerId,
      type,
      limit,
    });
  } catch (error) {
    logger.error('List payment methods error:', error);
    throw error;
  }
};

// Attach payment method
export const attachPaymentMethod = async (
  paymentMethodId: string,
  customerId: string
) => {
  try {
    return await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  } catch (error) {
    logger.error('Attach payment method error:', error);
    throw error;
  }
};

// Detach payment method
export const detachPaymentMethod = async (paymentMethodId: string) => {
  try {
    return await stripe.paymentMethods.detach(paymentMethodId);
  } catch (error) {
    logger.error('Detach payment method error:', error);
    throw error;
  }
};

// Update customer default payment method
export const updateCustomerDefaultPaymentMethod = async (
  customerId: string,
  paymentMethodId: string
) => {
  try {
    return await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  } catch (error) {
    logger.error('Update customer default payment method error:', error);
    throw error;
  }
};

export default {
  stripe,
  setupStripe,
  createCustomer,
  createConnectedAccount,
  createAccountLink,
  createPaymentIntent,
  confirmPaymentIntent,
  createRefund,
  createTransfer,
  createPayout,
  verifyWebhookSignature,
  getAccountBalance,
  getPaymentMethod,
  listPaymentMethods,
  attachPaymentMethod,
  detachPaymentMethod,
  updateCustomerDefaultPaymentMethod,
};