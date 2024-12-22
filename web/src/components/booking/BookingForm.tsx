'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice, calculateTotal } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { BookingCalendar } from './BookingCalendar';
import { Clock, Calendar, CreditCard } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface Extra {
  id: string;
  name: string;
  price: number;
}

interface Provider {
  id: string;
  full_name: string;
  hourly_rate: number;
  services: Service[];
  extras: Extra[];
  workingHours: {
    start: string;
    end: string;
    daysOff: number[];
  };
}

interface BookingFormProps {
  provider: Provider;
  existingBookings: Array<{ start: Date; end: Date }>;
}

export function BookingForm({ provider, existingBookings }: BookingFormProps) {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState(1); // in hours
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleExtraToggle = (extraId: string) => {
    const newExtras = new Set(selectedExtras);
    if (newExtras.has(extraId)) {
      newExtras.delete(extraId);
    } else {
      newExtras.add(extraId);
    }
    setSelectedExtras(newExtras);
  };

  const selectedExtrasArray = Array.from(selectedExtras).map((id) =>
    provider.extras.find((extra) => extra.id === id)
  );

  const total = calculateTotal(
    selectedService?.price ?? provider.hourly_rate,
    duration,
    selectedExtrasArray as { price: number }[]
  );

  const handleSubmit = async () => {
    if (!selectedTime) return;

    setIsLoading(true);
    try {
      // Create the booking in the database
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: provider.id,
          serviceId: selectedService?.id,
          extras: Array.from(selectedExtras),
          startTime: selectedTime,
          duration,
          notes,
          total,
        }),
      });

      if (!response.ok) throw new Error('Failed to create booking');

      const booking = await response.json();

      // Redirect to payment page
      router.push(`/bookings/${booking.id}/payment`);
    } catch (error) {
      console.error('Booking error:', error);
      // Handle error (show error message to user)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedService(null)}
              className={`p-4 text-left rounded-lg border ${
                !selectedService
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <h3 className="font-medium text-white">Standard Booking</h3>
              <p className="text-sm text-gray-400 mt-1">
                {formatPrice(provider.hourly_rate)}/hour
              </p>
            </button>
            {provider.services.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`p-4 text-left rounded-lg border ${
                  selectedService?.id === service.id
                    ? 'border-pink-500 bg-pink-500/10'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <h3 className="font-medium text-white">{service.name}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {service.description}
                </p>
                <p className="text-sm text-pink-500 mt-2">
                  {formatPrice(service.price)}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Extras */}
      {provider.extras.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Extras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {provider.extras.map((extra) => (
                <button
                  key={extra.id}
                  onClick={() => handleExtraToggle(extra.id)}
                  className={`p-4 text-left rounded-lg border ${
                    selectedExtras.has(extra.id)
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <h3 className="font-medium text-white">{extra.name}</h3>
                  <p className="text-sm text-pink-500 mt-2">
                    +{formatPrice(extra.price)}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date & Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date & Time</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingCalendar
            providerId={provider.id}
            existingBookings={existingBookings}
            workingHours={provider.workingHours}
            onTimeSelected={setSelectedTime}
          />
        </CardContent>
      </Card>

      {/* Duration Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Duration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setDuration(Math.max(1, duration - 1))}
              disabled={duration <= 1}
            >
              -
            </Button>
            <span className="text-lg font-medium text-white">{duration} hour(s)</span>
            <Button
              variant="outline"
              onClick={() => setDuration(duration + 1)}
              disabled={duration >= 8}
            >
              +
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-32 px-3 py-2 text-white bg-black border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Any special requests or information..."
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Service</span>
              <span className="text-white">
                {selectedService?.name ?? 'Standard Booking'}
              </span>
            </div>
            {selectedExtrasArray.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Extras</span>
                <span className="text-white">
                  {selectedExtrasArray
                    .map((extra) => extra?.name)
                    .join(', ')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Date & Time</span>
              <span className="text-white">
                {selectedTime
                  ? selectedTime.toLocaleString('de-DE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duration</span>
              <span className="text-white">{duration} hour(s)</span>
            </div>
            <div className="border-t border-gray-800 pt-4">
              <div className="flex justify-between text-lg font-medium">
                <span className="text-white">Total</span>
                <span className="text-pink-500">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!selectedTime || isLoading}
          >
            {isLoading ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}