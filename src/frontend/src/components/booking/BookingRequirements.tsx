import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  useTheme,
} from '@mui/material';
import {
  VerifiedUser as VerifiedUserIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { EscortProfile } from '@/types/profile';

interface BookingRequirementsProps {
  profile: EscortProfile;
  onComplete: (notes?: string, specialRequests?: string) => void;
  notes?: string;
  specialRequests?: string;
}

const BookingRequirements = ({
  profile,
  onComplete,
  notes: initialNotes = '',
  specialRequests: initialSpecialRequests = '',
}: BookingRequirementsProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [notes, setNotes] = useState(initialNotes);
  const [specialRequests, setSpecialRequests] = useState(
    initialSpecialRequests
  );
  const [acceptedRequirements, setAcceptedRequirements] = useState(false);

  const handleNotesChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNotes(event.target.value);
    onComplete(event.target.value, specialRequests);
  };

  const handleSpecialRequestsChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSpecialRequests(event.target.value);
    onComplete(notes, event.target.value);
  };

  const handleRequirementsAcceptance = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAcceptedRequirements(event.target.checked);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('booking.requirements')}
      </Typography>

      <Grid container spacing={3}>
        {/* Buchungsanforderungen */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('booking.bookingRequirements')}
            </Typography>
            <List>
              {profile.requirements?.deposit && (
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('booking.depositRequired')}
                    secondary={t('booking.depositAmount', {
                      amount: profile.requirements.depositAmount,
                    })}
                  />
                </ListItem>
              )}
              {profile.requirements?.identification && (
                <ListItem>
                  <ListItemIcon>
                    <VerifiedUserIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('booking.identificationRequired')}
                    secondary={t('booking.identificationInfo')}
                  />
                </ListItem>
              )}
              {profile.requirements?.screening && (
                <ListItem>
                  <ListItemIcon>
                    <AssignmentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('booking.screeningRequired')}
                    secondary={
                      profile.requirements.screeningType
                        ? t('booking.screeningType', {
                            type: profile.requirements.screeningType,
                          })
                        : t('booking.screeningInfo')
                    }
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Buchungsnotizen */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('booking.notes')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={notes}
              onChange={handleNotesChange}
              placeholder={t('booking.notesPlaceholder')}
              helperText={t('booking.notesHelp')}
            />
          </Paper>
        </Grid>

        {/* Spezielle Wünsche */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('booking.specialRequests')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={specialRequests}
              onChange={handleSpecialRequestsChange}
              placeholder={t('booking.specialRequestsPlaceholder')}
              helperText={t('booking.specialRequestsHelp')}
            />
          </Paper>
        </Grid>

        {/* Bestätigung der Anforderungen */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={acceptedRequirements}
                  onChange={handleRequirementsAcceptance}
                />
              }
              label={t('booking.acceptRequirements')}
            />
            <Collapse in={!acceptedRequirements}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <AlertTitle>{t('booking.requirementsAlert')}</AlertTitle>
                {t('booking.requirementsAlertText')}
              </Alert>
            </Collapse>
          </Paper>
        </Grid>
      </Grid>

      {/* Datenschutzhinweis */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="info" icon={<SecurityIcon />}>
          <AlertTitle>{t('booking.privacyNote')}</AlertTitle>
          {t('booking.privacyNoteText')}
        </Alert>
      </Box>
    </Box>
  );
};

export default BookingRequirements;