'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/Calendar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { generateTimeSlots, isAvailable } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface BookingCalendarProps {
  providerId: string;
  onTimeSelected: (time: Date) => void;
  existingBookings: Array<{ start: Date; end: Date }>;
  workingHours: {
    start: string; // "HH:mm" format
    end: string;
    daysOff: number[]; // 0 = Sunday, 6 = Saturday
  };
}

export function BookingCalendar({
  providerId,
  onTimeSelected,
  existingBookings,
  workingHours,
}: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      // Convert working hours to Date objects
      const [startHour, startMinute] = workingHours.start.split(':').map(Number);
      const [endHour, endMinute] = workingHours.end.split(':').map(Number);

      const startTime = new Date(selectedDate);
      startTime.setHours(startHour, startMinute, 0);

      const endTime = new Date(selectedDate);
      endTime.setHours(endHour, endMinute, 0);

      // Generate time slots
      const slots = generateTimeSlots(startTime, endTime, 30); // 30-minute intervals

      // Filter available slots
      const available = slots.filter(
        (slot) =>
          !workingHours.daysOff.includes(slot.getDay()) &&
          isAvailable(slot, existingBookings)
      );

      setAvailableSlots(available);
      setSelectedTime(null);
    };

    fetchAvailability();
  }, [selectedDate, existingBookings, workingHours]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
    onTimeSelected(time);
  };

  const timeSlotClassName = (slot: Date) => {
    const isSelected = selectedTime?.getTime() === slot.getTime();
    return `
      flex items-center justify-center px-4 py-2 rounded-md text-sm
      ${
        isSelected
          ? 'bg-pink-500 text-white'
          : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
      }
      transition-colors cursor-pointer
    `;
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Select Date & Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border border-gray-800"
              disabled={(date) => {
                // Disable past dates and days off
                const isPastDate = date < new Date();
                const isDayOff = workingHours.daysOff.includes(date.getDay());
                return isPastDate || isDayOff;
              }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">
                Available Time Slots
              </h3>
              <div className="flex items-center text-sm text-gray-400">
                <Clock className="w-4 h-4 mr-1" />
                {workingHours.start} - {workingHours.end}
              </div>
            </div>

            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.getTime()}
                    onClick={() => handleTimeSelect(slot)}
                    className={timeSlotClassName(slot)}
                  >
                    {slot.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No available slots for this date
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}