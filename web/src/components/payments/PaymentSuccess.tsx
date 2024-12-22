'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Check, Calendar, MessageSquare } from 'lucide-react';

interface PaymentSuccessProps {
  booking: {
    id: string;
    provider: {
      id: string;
      full_name: string;
    };
    startTime: string;
  };
}

export function PaymentSuccess({ booking }: PaymentSuccessProps) {
  return (
    <Card className="mx-auto max-w-lg text-center">
      <CardHeader>
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-green-500/10 p-3">
            <Check className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <CardTitle className="text-2xl">Payment Successful!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-gray-400">
          Your booking with {booking.provider.full_name} has been confirmed for{' '}
          {new Date(booking.startTime).toLocaleString('de-DE', {
            dateStyle: 'full',
            timeStyle: 'short',
          })}
          .
        </p>

        <div className="rounded-lg bg-gray-800/50 p-6">
          <h3 className="text-lg font-medium text-white">Next Steps</h3>
          <ul className="mt-4 space-y-4 text-left">
            <li className="flex items-start">
              <div className="mr-3 rounded-full bg-pink-500/10 p-1">
                <Calendar className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="font-medium text-white">Check your schedule</p>
                <p className="mt-1 text-sm text-gray-400">
                  The booking has been added to your calendar. Make sure to set a
                  reminder.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="mr-3 rounded-full bg-pink-500/10 p-1">
                <MessageSquare className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="font-medium text-white">Contact the provider</p>
                <p className="mt-1 text-sm text-gray-400">
                  You can now message the provider to discuss any details or
                  special requests.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="rounded-lg bg-gray-800/50 p-4 text-sm text-gray-400">
          <p>
            A confirmation email has been sent to your registered email address
            with all the booking details.
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-center space-x-4">
        <Link href={`/bookings/${booking.id}`}>
          <Button>View Booking Details</Button>
        </Link>
        <Link href={`/messages/${booking.provider.id}`}>
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Message Provider
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}