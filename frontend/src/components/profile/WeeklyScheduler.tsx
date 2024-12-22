import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Switch,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse } from 'date-fns';
import { de } from 'date-fns/locale';

interface TimeSlot {
  start: string; // HH:mm format
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

interface WeeklySchedulerProps {
  schedule: {
    [key: string]: DaySchedule; // 0-6 for days of week
  };
  onChange: (schedule: { [key: string]: DaySchedule }) => void;
}

const DAYS = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag'
];

export function WeeklyScheduler({ schedule, onChange }: WeeklySchedulerProps) {
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);

  function handleDayToggle(day: string) {
    onChange({
      ...schedule,
      [day]: {
        ...schedule[day],
        enabled: !schedule[day]?.enabled
      }
    });
  }

  function handleAddSlot(day: string) {
    setEditingDay(day);
    setEditingSlot({ start: '09:00', end: '17:00' });
    setEditingSlotIndex(null);
  }

  function handleEditSlot(day: string, slot: TimeSlot, index: number) {
    setEditingDay(day);
    setEditingSlot(slot);
    setEditingSlotIndex(index);
  }

  function handleDeleteSlot(day: string, index: number) {
    const updatedSchedule = {
      ...schedule,
      [day]: {
        ...schedule[day],
        slots: schedule[day].slots.filter((_, i) => i !== index)
      }
    };
    onChange(updatedSchedule);
  }

  function handleSaveSlot() {
    if (!editingDay || !editingSlot) return;

    const updatedSlots = [...(schedule[editingDay]?.slots || [])];
    
    if (editingSlotIndex !== null) {
      updatedSlots[editingSlotIndex] = editingSlot;
    } else {
      updatedSlots.push(editingSlot);
    }

    // Sort slots by start time
    updatedSlots.sort((a, b) => {
      const timeA = parse(a.start, 'HH:mm', new Date());
      const timeB = parse(b.start, 'HH:mm', new Date());
      return timeA.getTime() - timeB.getTime();
    });

    onChange({
      ...schedule,
      [editingDay]: {
        ...schedule[editingDay],
        slots: updatedSlots
      }
    });

    handleCloseDialog();
  }

  function handleCloseDialog() {
    setEditingDay(null);
    setEditingSlot(null);
    setEditingSlotIndex(null);
  }

  function handleCopySchedule(fromDay: string) {
    const daySchedule = schedule[fromDay];
    
    // Copy the schedule to all other enabled days
    const updatedSchedule = { ...schedule };
    Object.keys(schedule).forEach(day => {
      if (day !== fromDay && schedule[day].enabled) {
        updatedSchedule[day] = {
          ...updatedSchedule[day],
          slots: [...daySchedule.slots]
        };
      }
    });

    onChange(updatedSchedule);
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} locale={de}>
      <Box>
        <Grid container spacing={2}>
          {DAYS.map((dayName, index) => (
            <Grid item xs={12} key={index}>
              <Paper sx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={schedule[index]?.enabled ?? false}
                          onChange={() => handleDayToggle(index.toString())}
                        />
                      }
                      label={dayName}
                    />
                  </Grid>
                  <Grid item xs={7}>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {schedule[index]?.slots.map((slot, slotIndex) => (
                        <Chip
                          key={slotIndex}
                          label={`${slot.start} - ${slot.end}`}
                          onDelete={() => handleDeleteSlot(index.toString(), slotIndex)}
                          onClick={() => handleEditSlot(index.toString(), slot, slotIndex)}
                          disabled={!schedule[index]?.enabled}
                        />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={2}>
                    <Box display="flex" justifyContent="flex-end">
                      <IconButton
                        onClick={() => handleAddSlot(index.toString())}
                        disabled={!schedule[index]?.enabled}
                      >
                        <AddIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleCopySchedule(index.toString())}
                        disabled={!schedule[index]?.enabled || schedule[index]?.slots.length === 0}
                      >
                        <CopyIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Time Slot Dialog */}
        <Dialog open={Boolean(editingDay)} onClose={handleCloseDialog}>
          <DialogTitle>
            {editingSlotIndex !== null ? 'Zeitslot bearbeiten' : 'Neuer Zeitslot'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TimePicker
                label="Startzeit"
                value={parse(editingSlot?.start || '00:00', 'HH:mm', new Date())}
                onChange={(newValue) => {
                  if (newValue) {
                    setEditingSlot(prev => ({
                      ...prev!,
                      start: format(newValue, 'HH:mm')
                    }));
                  }
                }}
              />
              <Box sx={{ mt: 2 }}>
                <TimePicker
                  label="Endzeit"
                  value={parse(editingSlot?.end || '00:00', 'HH:mm', new Date())}
                  onChange={(newValue) => {
                    if (newValue) {
                      setEditingSlot(prev => ({
                        ...prev!,
                        end: format(newValue, 'HH:mm')
                      }));
                    }
                  }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Abbrechen</Button>
            <Button onClick={handleSaveSlot} variant="contained">
              Speichern
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}