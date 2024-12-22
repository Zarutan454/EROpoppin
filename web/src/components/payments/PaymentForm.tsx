'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardElement, useStripe, useElements } from '@stripe/stripe-react-js';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import { Shield, CreditCard } from 'lucide-react';

interface PaymentFormProps {
  booking: {
    id: string;
    provider: {
      id: string;
      full_name: string;
    };
    service?: {
      name: string;
      price: number;
    };
    startTime: string;
    duration: number;
    total: number;
    extras?: Array<{
      name: string;
      price: number;
    }>;
  };
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const cardStyle = {
  style: {
    base: {
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#6b7280',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

export function PaymentForm({
  booking,
  clientSecret,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [cardError, setCardError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);
    setCardError('');

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      );

      if (error) {
        setCardError(error.message || 'An error occurred with your payment');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setCardError('An unexpected error occurred');
      onError('Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Booking Summary */}
          <div className="rounded-lg bg-gray-800/50 p-4">
            <h3 className="text-lg font-medium text-white">Booking Summary</h3>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Provider</span>
                <span className="text-white">{booking.provider.full_name}</span>
              </div>
              {booking.service && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Service</span>
                  <span className="text-white">{booking.service.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Date & Time</span>
                <span className="text-white">
                  {new Date(booking.startTime).toLocaleString('de-DE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration</span>
                <span className="text-white">{booking.duration} hour(s)</span>
              </div>
              {booking.extras && booking.extras.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Extras</span>
                  <div className="text-right">
                    {booking.extras.map((extra) => (
                      <div key={extra.name}>
                        <span className="text-white">{extra.name}</span>
                        <span className="ml-2 text-pink-500">
                          {formatPrice(extra.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t border-gray-700 pt-2">
                <div className="flex justify-between text-lg font-medium">
                  <span className="text-white">Total</span>
                  <span className="text-pink-500">
                    {formatPrice(booking.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Element */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">
              Card Information
            </label>
            <div className="rounded-md border border-gray-800 p-4">
              <CardElement options={cardStyle} />
            </div>
          </div>

          {cardError && (
            <div className="rounded-md bg-red-500/10 p-4 text-sm text-red-500">
              {cardError}
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Shield className="h-4 w-4" />
            <p>Your payment information is secure and encrypted</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay {formatPrice(booking.total)}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}