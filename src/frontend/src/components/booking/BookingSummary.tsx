import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  EventAvailable as EventIcon,
  Place as PlaceIcon,
  Category as ServiceIcon,
  Payment as PaymentIcon,
  Assignment as NotesIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { EscortProfile } from '@/types/profile';
import { BookingRequest } from '@/types/booking';
import { formatCurrency, formatDuration } from '@/utils/format';

interface BookingSummaryProps {
  profile: EscortProfile;
  bookingData: Partial<BookingRequest>;
  onSubmit: () => Promise<void>;
}

const BookingSummary = ({
  profile,
  bookingData,
  onSubmit,
}: BookingSummaryProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit();
    } catch (error) {
      console.error('Booking submission error:', error);
      setError(t('booking.submissionError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedServices = profile.services.filter((service) =>
    bookingData.services?.includes(service.id)
  );

  const selectedExtras = profile.services
    .flatMap((service) => service.extras || [])
    .filter((extra) => bookingData.extras?.includes(extra.id));

  const calculateTotal = () => {
    const servicesTotal = selectedServices.reduce(
      (sum, service) => sum + service.price,
      0
    );
    const extrasTotal = selectedExtras.reduce(
      (sum, extra) => sum + extra.price,
      0
    );
    return servicesTotal + extrasTotal;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('booking.summary')}
      </Typography>

      <Grid container spacing={3}>
        {/* Zusammenfassung */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <List>
              {/* Datum und Zeit */}
              <ListItem>
                <ListItemIcon>
                  <EventIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={t('booking.dateAndTime')}
                  secondary={
                    bookingData.date
                      ? `${format(
                          new Date(bookingData.date),
                          'EEEE, d. MMMM yyyy',
                          { locale: de }
                        )} ${bookingData.startTime} (${formatDuration(
                          bookingData.duration || 0
                        )})`
                      : '-'
                  }
                />
              </ListItem>

              {/* Ort */}
              <ListItem>
                <ListItemIcon>
                  <PlaceIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={t('booking.location')}
                  secondary={
                    bookingData.location
                      ? `${
                          bookingData.location.type === 'incall'
                            ? t('booking.incall')
                            : t('booking.outcall')
                        } - ${bookingData.location.city}${
                          bookingData.location.address
                            ? `, ${bookingData.location.address}`
                            : ''
                        }`
                      : '-'
                  }
                />
              </ListItem>

              {/* Services */}
              <ListItem>
                <ListItemIcon>
                  <ServiceIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={t('booking.services')}
                  secondary={
                    <Box>
                      {selectedServices.map((service) => (
                        <Typography
                          key={service.id}
                          variant="body2"
                          component="div"
                        >
                          {service.name} -{' '}
                          <Typography
                            component="span"
                            color="primary"
                          >
                            {formatCurrency(service.price)}
                          </Typography>
                        </Typography>
                      ))}
                      {selectedExtras.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                          >
                            {t('booking.extras')}:
                          </Typography>
                          {selectedExtras.map((extra) => (
                            <Typography
                              key={extra.id}
                              variant="body2"
                              component="div"
                            >
                              {extra.name} -{' '}
                              <Typography
                                component="span"
                                color="primary"
                              >
                                {formatCurrency(extra.price)}
                              </Typography>
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>

              {/* Notizen */}
              {(bookingData.notes || bookingData.specialRequests) && (
                <ListItem>
                  <ListItemIcon>
                    <NotesIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('booking.notes')}
                    secondary={
                      <Box>
                        {bookingData.notes && (
                          <Typography variant="body2" paragraph>
                            {bookingData.notes}
                          </Typography>
                        )}
                        {bookingData.specialRequests && (
                          <>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                            >
                              {t('booking.specialRequests')}:
                            </Typography>
                            <Typography variant="body2">
                              {bookingData.specialRequests}
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Gesamtpreis */}
              <ListItem>
                <ListItemIcon>
                  <PaymentIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={t('booking.total')}
                  secondary={
                    <Typography
                      variant="h6"
                      color="primary"
                      sx={{ mt: 1 }}
                    >
                      {formatCurrency(calculateTotal())}
                    </Typography>
                  }
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Fehleranzeige */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">
              <AlertTitle>{t('common.error')}</AlertTitle>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Hinweise */}
        <Grid item xs={12}>
          <Alert severity="info">
            <AlertTitle>{t('booking.importantNotes')}</AlertTitle>
            <Typography variant="body2" paragraph>
              {t('booking.cancellationPolicy')}
            </Typography>
            <Typography variant="body2">
              {t('booking.confirmationNote')}
            </Typography>
          </Alert>
        </Grid>

        {/* Aktionsbuttons */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 2,
            }}
          >
            <Button variant="outlined">
              {t('common.back')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting}
              sx={{ minWidth: 200 }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} sx={{ mr: 1 }} />
              ) : null}
              {t('booking.confirmBooking')}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BookingSummary;