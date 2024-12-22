import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
  useTheme,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useTranslation } from 'react-i18next';
import { format, addDays, isAfter, isBefore, set } from 'date-fns';
import { de } from 'date-fns/locale';

import { EscortProfile } from '@/types/profile';
import { BookingSlot } from '@/types/booking';
import { durationOptions } from '@/utils/options';
import { useBooking } from '@/hooks/useBooking';

interface DateTimeSelectorProps {
  profile: EscortProfile;
  onSelect: (date: string, startTime: string, duration: number) => void;
  selectedDate?: string;
  selectedTime?: string;
  selectedDuration?: number;
}

const DateTimeSelector = ({
  profile,
  onSelect,
  selectedDate,
  selectedTime,
  selectedDuration,
}: DateTimeSelectorProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [date, setDate] = useState<Date | null>(
    selectedDate ? new Date(selectedDate) : null
  );
  const [time, setTime] = useState<Date | null>(
    selectedTime ? set(new Date(), {
      hours: parseInt(selectedTime.split(':')[0]),
      minutes: parseInt(selectedTime.split(':')[1]),
    }) : null
  );
  const [duration, setDuration] = useState<number>(selectedDuration || 60);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDate = new Date();
  const maxDate = addDays(new Date(), 30); // 30 Tage im Voraus buchbar

  // Verfügbare Zeitslots laden
  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!date) return;

      setIsLoading(true);
      setError(null);

      try {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const slots = await bookingService.getAvailableSlots(
          profile.id,
          formattedDate
        );
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Error loading slots:', error);
        setError(t('booking.errorLoadingSlots'));
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailableSlots();
  }, [date, profile.id]);

  // Überprüfen, ob der ausgewählte Zeitslot verfügbar ist
  const isTimeSlotAvailable = (selectedTime: Date): boolean => {
    if (!availableSlots.length) return false;

    const timeString = format(selectedTime, 'HH:mm');
    const endTimeString = format(
      set(selectedTime, {
        hours: selectedTime.getHours() + Math.floor(duration / 60),
        minutes: selectedTime.getMinutes() + (duration % 60),
      }),
      'HH:mm'
    );

    return availableSlots.some(
      (slot) =>
        slot.isAvailable &&
        timeString >= slot.startTime &&
        endTimeString <= slot.endTime
    );
  };

  // Handler für Datums-, Zeit- und Dauerauswahl
  const handleDateChange = (newDate: Date | null) => {
    setDate(newDate);
    setTime(null); // Zeit zurücksetzen bei Datumsänderung
  };

  const handleTimeChange = (newTime: Date | null) => {
    if (newTime && date) {
      const combinedDateTime = set(date, {
        hours: newTime.getHours(),
        minutes: newTime.getMinutes(),
      });

      if (isTimeSlotAvailable(combinedDateTime)) {
        setTime(newTime);
        updateSelection(date, newTime, duration);
      }
    }
  };

  const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = parseInt(event.target.value);
    setDuration(newDuration);
    if (date && time) {
      updateSelection(date, time, newDuration);
    }
  };

  const updateSelection = (
    selectedDate: Date,
    selectedTime: Date,
    selectedDuration: number
  ) => {
    onSelect(
      format(selectedDate, 'yyyy-MM-dd'),
      format(selectedTime, 'HH:mm'),
      selectedDuration
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('booking.selectDateTime')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <DatePicker
              label={t('booking.date')}
              value={date}
              onChange={handleDateChange}
              minDate={minDate}
              maxDate={maxDate}
              format="dd.MM.yyyy"
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: Boolean(error),
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TimePicker
              label={t('booking.time')}
              value={time}
              onChange={handleTimeChange}
              disabled={!date || isLoading}
              minutesStep={30}
              format="HH:mm"
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: Boolean(error),
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label={t('booking.duration')}
              value={duration}
              onChange={handleDurationChange}
              disabled={!date || !time}
            >
              {durationOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {t(option.label)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {isLoading && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress />
              </Box>
            </Grid>
          )}

          {!isLoading && availableSlots.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                {t('booking.availableSlots')}:
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  mt: 1,
                }}
              >
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant={
                      time &&
                      format(time, 'HH:mm') >= slot.startTime &&
                      format(time, 'HH:mm') <= slot.endTime
                        ? 'contained'
                        : 'outlined'
                    }
                    disabled={!slot.isAvailable}
                    size="small"
                    onClick={() => {
                      if (date) {
                        const [hours, minutes] = slot.startTime.split(':');
                        const newTime = set(new Date(), {
                          hours: parseInt(hours),
                          minutes: parseInt(minutes),
                        });
                        handleTimeChange(newTime);
                      }
                    }}
                  >
                    {`${slot.startTime} - ${slot.endTime}`}
                  </Button>
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t('booking.dateTimeInfo')}
        </Typography>
      </Box>
    </Box>
  );
};

export default DateTimeSelector;