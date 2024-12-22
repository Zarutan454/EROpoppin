import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useTranslation } from 'react-i18next';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { format, parse } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

import { EscortProfile, Availability } from '@/types/profile';

interface AvailabilityCalendarProps {
  profile: EscortProfile;
  onSave: (data: Partial<EscortProfile>) => Promise<void>;
  isSaving: boolean;
}

const AvailabilityCalendar = ({
  profile,
  onSave,
  isSaving,
}: AvailabilityCalendarProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [availability, setAvailability] = useState<Availability[]>(
    profile.availability || []
  );

  const daysOfWeek = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const handleTimeChange = (
    dayIndex: number,
    slotIndex: number,
    field: 'startTime' | 'endTime',
    value: Date | null
  ) => {
    if (!value) return;

    const newAvailability = [...availability];
    const timeString = format(value, 'HH:mm');

    const existingDaySlots = newAvailability.filter(
      (slot) => slot.dayOfWeek === dayIndex
    );

    if (existingDaySlots[slotIndex]) {
      existingDaySlots[slotIndex][field] = timeString;
    } else {
      const newSlot: Availability = {
        id: `${dayIndex}-${slotIndex}-${Date.now()}`,
        dayOfWeek: dayIndex,
        startTime: field === 'startTime' ? timeString : '09:00',
        endTime: field === 'endTime' ? timeString : '17:00',
        isAvailable: true,
      };
      newAvailability.push(newSlot);
    }

    setAvailability(newAvailability);
  };

  const handleAvailabilityToggle = (
    dayIndex: number,
    slotIndex: number
  ) => {
    const newAvailability = [...availability];
    const slot = newAvailability.find(
      (s) => s.dayOfWeek === dayIndex && s.id.includes(`${slotIndex}`)
    );

    if (slot) {
      slot.isAvailable = !slot.isAvailable;
      setAvailability(newAvailability);
    }
  };

  const addTimeSlot = (dayIndex: number) => {
    const newSlot: Availability = {
      id: `${dayIndex}-${Date.now()}`,
      dayOfWeek: dayIndex,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
    };

    setAvailability([...availability, newSlot]);
  };

  const removeTimeSlot = (id: string) => {
    setAvailability(availability.filter((slot) => slot.id !== id));
  };

  const copyToAllDays = (sourceDay: number) => {
    const sourceDaySlots = availability.filter(
      (slot) => slot.dayOfWeek === sourceDay
    );

    const newAvailability = [...availability];

    daysOfWeek.forEach((_, targetDay) => {
      if (targetDay !== sourceDay) {
        // Remove existing slots for target day
        const targetDaySlots = newAvailability.filter(
          (slot) => slot.dayOfWeek === targetDay
        );
        targetDaySlots.forEach((slot) => {
          const index = newAvailability.indexOf(slot);
          if (index > -1) {
            newAvailability.splice(index, 1);
          }
        });

        // Copy source day slots to target day
        sourceDaySlots.forEach((sourceSlot) => {
          newAvailability.push({
            ...sourceSlot,
            id: `${targetDay}-${Date.now()}-${Math.random()}`,
            dayOfWeek: targetDay,
          });
        });
      }
    });

    setAvailability(newAvailability);
  };

  const handleSave = async () => {
    await onSave({ availability });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('profile.availability')}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {daysOfWeek.map((day, dayIndex) => (
            <Grid item xs={12} key={day}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ minWidth: 100 }}>
                  {t(`days.${day}`)}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <AnimatePresence>
                    {availability
                      .filter((slot) => slot.dayOfWeek === dayIndex)
                      .map((slot, slotIndex) => (
                        <motion.div
                          key={slot.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              mb: 1,
                            }}
                          >
                            <TimePicker
                              label={t('profile.startTime')}
                              value={parse(slot.startTime, 'HH:mm', new Date())}
                              onChange={(value) =>
                                handleTimeChange(
                                  dayIndex,
                                  slotIndex,
                                  'startTime',
                                  value
                                )
                              }
                            />
                            <TimePicker
                              label={t('profile.endTime')}
                              value={parse(slot.endTime, 'HH:mm', new Date())}
                              onChange={(value) =>
                                handleTimeChange(
                                  dayIndex,
                                  slotIndex,
                                  'endTime',
                                  value
                                )
                              }
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={slot.isAvailable}
                                  onChange={() =>
                                    handleAvailabilityToggle(dayIndex, slotIndex)
                                  }
                                />
                              }
                              label={t('profile.available')}
                            />
                            <IconButton
                              onClick={() => removeTimeSlot(slot.id)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                  <Tooltip title={t('profile.addTimeSlot')}>
                    <IconButton
                      onClick={() => addTimeSlot(dayIndex)}
                      color="primary"
                      size="small"
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('profile.copyToAllDays')}>
                    <IconButton
                      onClick={() => copyToAllDays(dayIndex)}
                      color="primary"
                      size="small"
                    >
                      <CopyIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving}
          sx={{ minWidth: 200 }}
        >
          {isSaving ? (
            <CircularProgress size={24} sx={{ mr: 1 }} />
          ) : null}
          {t('common.save')}
        </Button>
      </Box>
    </Box>
  );
};

export default AvailabilityCalendar;