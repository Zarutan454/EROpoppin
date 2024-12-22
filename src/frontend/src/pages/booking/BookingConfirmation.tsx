import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  EventAvailable as EventIcon,
  Place as PlaceIcon,
  Payment as PaymentIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { useBooking } from '@/hooks/useBooking';
import { useProfile } from '@/hooks/useProfile';
import LoadingScreen from '@/components/common/LoadingScreen';
import { formatCurrency } from '@/utils/format';

const BookingConfirmation = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { booking, isLoading, error } = useBooking(bookingId);
  const { profile } = useProfile(booking?.escortId);

  useEffect(() => {
    if (!bookingId) {
      navigate('/bookings');
    }
  }, [bookingId, navigate]);

  if (isLoading || !booking || !profile) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 3 }}>
          <AlertTitle>{t('common.error')}</AlertTitle>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper sx={{ mt: 3, p: { xs: 2, md: 3 } }}>
          {/* Erfolgsheader */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 4,
              gap: 2,
            }}
          >
            <SuccessIcon
              color="success"
              sx={{ fontSize: 48 }}
            />
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontFamily: 'Playfair Display' }}
              >
                {t('booking.confirmationTitle')}
              </Typography>
              <Typography color="text.secondary">
                {t('booking.bookingNumber', {
                  number: booking.id,
                })}
              </Typography>
            </Box>
          </Box>

          {/* Buchungsdetails */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <List>
                {/* Datum und Zeit */}
                <ListItem>
                  <ListItemIcon>
                    <EventIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('booking.dateAndTime')}
                    secondary={`${format(
                      new Date(booking.date),
                      'EEEE, d. MMMM yyyy',
                      { locale: de }
                    )} ${booking.startTime} - ${booking.endTime}`}
                  />
                </ListItem>

                {/* Ort */}
                <ListItem>
                  <ListItemIcon>
                    <PlaceIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('booking.location')}
                    secondary={`${
                      booking.location.type === 'incall'
                        ? t('booking.incall')
                        : t('booking.outcall')
                    } - ${booking.location.city}${
                      booking.location.address
                        ? `, ${booking.location.address}`
                        : ''
                    }`}
                  />
                </ListItem>

                <Divider sx={{ my: 2 }} />

                {/* Zahlungsinformationen */}
                <ListItem>
                  <ListItemIcon>
                    <PaymentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('booking.paymentDetails')}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {t('booking.total')}:{' '}
                          <Typography
                            component="span"
                            color="primary"
                            fontWeight="bold"
                          >
                            {formatCurrency(booking.totalAmount)}
                          </Typography>
                        </Typography>
                        {booking.deposit && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {t('booking.depositPaid')}:{' '}
                            {formatCurrency(booking.deposit.amount)}
                          </Typography>
                        )}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {t('booking.paymentMethod')}:{' '}
                          {t(`paymentMethods.${booking.payment.method}`)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>

                <Divider sx={{ my: 2 }} />

                {/* Kontaktinformationen */}
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('booking.confirmation')}
                    secondary={t('booking.confirmationSent')}
                  />
                </ListItem>
                {profile.contactPhone && (
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('booking.contact')}
                      secondary={profile.contactPhone}
                    />
                  </ListItem>
                )}
              </List>
            </Grid>

            {/* Wichtige Hinweise */}
            <Grid item xs={12}>
              <Alert severity="info">
                <AlertTitle>{t('booking.nextSteps')}</AlertTitle>
                <Typography variant="body2" paragraph>
                  {t('booking.nextStepsText')}
                </Typography>
                <List>
                  {booking.requirements.deposit && (
                    <ListItem>
                      <ListItemText
                        primary={t('booking.depositInstruction')}
                      />
                    </ListItem>
                  )}
                  {booking.requirements.identification && (
                    <ListItem>
                      <ListItemText
                        primary={t('booking.identificationInstruction')}
                      />
                    </ListItem>
                  )}
                  {booking.requirements.screening && (
                    <ListItem>
                      <ListItemText
                        primary={t('booking.screeningInstruction')}
                      />
                    </ListItem>
                  )}
                </List>
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
                <Button
                  variant="outlined"
                  onClick={() => navigate('/bookings')}
                >
                  {t('booking.viewAllBookings')}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => window.print()}
                >
                  {t('booking.printConfirmation')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default BookingConfirmation;