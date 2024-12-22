import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { sendNotification } from '../services/notifications';
import { sendEmail } from '../services/email';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { calculateApplicationFee } from '../utils/payment';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Create payment intent
export const createPaymentIntent = async (req: Request, res: Response) => {
  const { booking_id, payment_method_id, save_payment_method } = req.body;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: booking_id },
      include: {
        provider: {
          include: {
            stripe_account: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (booking.payment_status === 'paid') {
      throw new ApiError(400, 'Booking has already been paid');
    }

    if (!booking.provider.stripe_account?.account_id) {
      throw new ApiError(400, 'Provider has not set up their payment account');
    }

    const { applicationFee, providerAmount } = calculateApplicationFee(booking.price);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.price * 100, // Convert to cents
      currency: 'usd',
      payment_method: payment_method_id,
      customer: req.user.stripe_customer_id,
      setup_future_usage: save_payment_method ? 'off_session' : undefined,
      application_fee_amount: applicationFee * 100,
      transfer_data: {
        destination: booking.provider.stripe_account.account_id,
      },
      metadata: {
        booking_id: booking.id,
        user_id: req.user.id,
        provider_id: booking.provider_id,
      },
    });

    await prisma.booking.update({
      where: { id: booking_id },
      data: {
        payment_intent_id: paymentIntent.id,
        provider_amount: providerAmount,
        platform_fee: applicationFee,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    logger.error('Create payment intent error:', error);
    throw error;
  }
};

// Confirm payment
export const confirmPayment = async (req: Request, res: Response) => {
  const { paymentIntentId } = req.params;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const booking = await prisma.booking.findFirst({
      where: { payment_intent_id: paymentIntentId },
      include: {
        user: {
          select: {
            email: true,
            full_name: true,
          },
        },
        provider: {
          select: {
            email: true,
            full_name: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (paymentIntent.status === 'succeeded') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          payment_status: 'paid',
          paid_at: new Date(),
        },
      });

      // Send notifications
      await Promise.all([
        sendNotification({
          user_id: booking.provider_id,
          title: 'Payment Received',
          message: `Payment received for booking #${booking.reference}`,
          type: 'payment',
          data: { booking_id: booking.id },
        }),
        sendEmail({
          to: booking.user.email,
          subject: 'Payment Confirmation',
          template: 'payment-confirmation',
          context: {
            client_name: booking.user.full_name,
            booking_reference: booking.reference,
            amount: booking.price,
            provider_name: booking.provider.full_name,
          },
        }),
        sendEmail({
          to: booking.provider.email,
          subject: 'Payment Received',
          template: 'payment-received',
          context: {
            provider_name: booking.provider.full_name,
            booking_reference: booking.reference,
            amount: booking.provider_amount,
            platform_fee: booking.platform_fee,
          },
        }),
      ]);

      res.json({ status: 'succeeded' });
    } else {
      res.json({ status: paymentIntent.status });
    }
  } catch (error) {
    logger.error('Confirm payment error:', error);
    throw error;
  }
};

// Get payment methods
export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: req.user.stripe_customer_id,
      type: 'card',
    });

    res.json(paymentMethods.data);
  } catch (error) {
    logger.error('Get payment methods error:', error);
    throw error;
  }
};

// Add payment method
export const addPaymentMethod = async (req: Request, res: Response) => {
  const { payment_method_id } = req.body;

  try {
    const paymentMethod = await stripe.paymentMethods.attach(
      payment_method_id,
      { customer: req.user.stripe_customer_id }
    );

    res.json(paymentMethod);
  } catch (error) {
    logger.error('Add payment method error:', error);
    throw error;
  }
};

// Remove payment method
export const removePaymentMethod = async (req: Request, res: Response) => {
  const { paymentMethodId } = req.params;

  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    res.json({ message: 'Payment method removed' });
  } catch (error) {
    logger.error('Remove payment method error:', error);
    throw error;
  }
};

// Set default payment method
export const setDefaultPaymentMethod = async (req: Request, res: Response) => {
  const { paymentMethodId } = req.params;

  try {
    await stripe.customers.update(req.user.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({ message: 'Default payment method updated' });
  } catch (error) {
    logger.error('Set default payment method error:', error);
    throw error;
  }
};

// Get transaction history
export const getTransactionHistory = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const transactions = await prisma.booking.findMany({
      where: {
        OR: [
          { user_id: req.user.id },
          { provider_id: req.user.id },
        ],
        payment_status: 'paid',
      },
      select: {
        id: true,
        reference: true,
        price: true,
        provider_amount: true,
        platform_fee: true,
        paid_at: true,
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
        provider: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      orderBy: { paid_at: 'desc' },
    });

    const total = await prisma.booking.count({
      where: {
        OR: [
          { user_id: req.user.id },
          { provider_id: req.user.id },
        ],
        payment_status: 'paid',
      },
    });

    res.json({
      transactions,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Get transaction history error:', error);
    throw error;
  }
};

// Create connected account
export const createConnectedAccount = async (req: Request, res: Response) => {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: req.user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    });

    await prisma.stripeAccount.create({
      data: {
        user_id: req.user.id,
        account_id: account.id,
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.CLIENT_URL}/settings/payments`,
      return_url: `${process.env.CLIENT_URL}/settings/payments`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    logger.error('Create connected account error:', error);
    throw error;
  }
};

// Get account balance
export const getAccountBalance = async (req: Request, res: Response) => {
  try {
    const stripeAccount = await prisma.stripeAccount.findUnique({
      where: { user_id: req.user.id },
    });

    if (!stripeAccount) {
      throw new ApiError(404, 'Stripe account not found');
    }

    const balance = await stripe.balance.retrieve({
      stripeAccount: stripeAccount.account_id,
    });

    res.json(balance);
  } catch (error) {
    logger.error('Get account balance error:', error);
    throw error;
  }
};

// Get payout history
export const getPayoutHistory = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const stripeAccount = await prisma.stripeAccount.findUnique({
      where: { user_id: req.user.id },
    });

    if (!stripeAccount) {
      throw new ApiError(404, 'Stripe account not found');
    }

    const payouts = await stripe.payouts.list({
      stripeAccount: stripeAccount.account_id,
      limit: parseInt(limit as string),
      starting_after: page === '1' ? undefined : ((parseInt(page as string) - 1) * parseInt(limit as string)).toString(),
    });

    res.json({
      payouts: payouts.data,
      has_more: payouts.has_more,
    });
  } catch (error) {
    logger.error('Get payout history error:', error);
    throw error;
  }
};

// Withdraw funds
export const withdrawFunds = async (req: Request, res: Response) => {
  const { amount, currency } = req.body;

  try {
    const stripeAccount = await prisma.stripeAccount.findUnique({
      where: { user_id: req.user.id },
    });

    if (!stripeAccount) {
      throw new ApiError(404, 'Stripe account not found');
    }

    const payout = await stripe.payouts.create(
      {
        amount: amount * 100,
        currency,
      },
      {
        stripeAccount: stripeAccount.account_id,
      }
    );

    res.json(payout);
  } catch (error) {
    logger.error('Withdraw funds error:', error);
    throw error;
  }
};

// Update bank info
export const updateBankInfo = async (req: Request, res: Response) => {
  const {
    account_holder_name,
    account_number,
    routing_number,
    account_type,
    currency,
    country,
  } = req.body;

  try {
    const stripeAccount = await prisma.stripeAccount.findUnique({
      where: { user_id: req.user.id },
    });

    if (!stripeAccount) {
      throw new ApiError(404, 'Stripe account not found');
    }

    const bankAccount = await stripe.accounts.createExternalAccount(
      stripeAccount.account_id,
      {
        external_account: {
          object: 'bank_account',
          account_holder_name,
          account_holder_type: 'individual',
          account_number,
          routing_number,
          account_type,
          currency,
          country,
        },
      }
    );

    res.json(bankAccount);
  } catch (error) {
    logger.error('Update bank info error:', error);
    throw error;
  }
};

// Get Stripe account status
export const getStripeAccountStatus = async (req: Request, res: Response) => {
  try {
    const stripeAccount = await prisma.stripeAccount.findUnique({
      where: { user_id: req.user.id },
    });

    if (!stripeAccount) {
      throw new ApiError(404, 'Stripe account not found');
    }

    const account = await stripe.accounts.retrieve(stripeAccount.account_id);

    res.json({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: account.requirements,
    });
  } catch (error) {
    logger.error('Get Stripe account status error:', error);
    throw error;
  }
};