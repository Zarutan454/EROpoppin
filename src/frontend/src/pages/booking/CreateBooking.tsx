import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Alert,
  AlertTitle,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { useBooking } from '@/hooks/useBooking';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import DateTimeSelector from '@/components/booking/DateTimeSelector';
import ServiceSelector from '@/components/booking/ServiceSelector';
import LocationSelector from '@/components/booking/LocationSelector';
import BookingSummary from '@/components/booking/BookingSummary';
import BookingRequirements from '@/components/booking/BookingRequirements';
import PaymentForm from '@/components/booking/PaymentForm';
import LoadingScreen from '@/components/common/LoadingScreen';
import { BookingRequest } from '@/types/booking';

const CreateBooking = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { escortId } = useParams();
  const { user } = useAuth();
  const { profile, isLoading: isLoadingProfile } = useProfile(escortId);
  const { createBooking, isCreating } = useBooking();

  const [activeStep, setActiveStep] = useState(0);
  const [bookingData, setBookingData] = useState<Partial<BookingRequest>>({
    escortId,
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const steps = [
    'booking.steps.dateTime',
    'booking.steps.services',
    'booking.steps.location',
    'booking.steps.requirements',
    'booking.steps.payment',
    'booking.steps.summary',
  ];

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleDateTimeSelect = (date: string, startTime: string, duration: number) => {
    setBookingData((prev) => ({
      ...prev,
      date,
      startTime,
      duration,
    }));
  };

  const handleServicesSelect = (services: string[], extras?: string[]) => {
    setBookingData((prev) => ({
      ...prev,
      services,
      extras,
    }));
  };

  const handleLocationSelect = (location: {
    type: 'incall' | 'outcall';
    address?: string;
    city: string;
  }) => {
    setBookingData((prev) => ({
      ...prev,
      location,
    }));
  };

  const handleRequirementsComplete = (notes?: string, specialRequests?: string) => {
    setBookingData((prev) => ({
      ...prev,
      notes,
      specialRequests,
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/booking/${escortId}` } });
      return;
    }

    try {
      const booking = await createBooking(bookingData as BookingRequest);
      navigate(`/bookings/${booking.id}/confirmation`);
    } catch (error) {
      console.error('Booking creation error:', error);
    }
  };

  if (isLoadingProfile) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 3 }}>
          <AlertTitle>{t('error.profileNotFound')}</AlertTitle>
          {t('error.profileNotFoundText')}
        </Alert>
      </Container>
    );
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <DateTimeSelector
            profile={profile}
            onSelect={handleDateTimeSelect}
            selectedDate={bookingData.date}
            selectedTime={bookingData.startTime}
            selectedDuration={bookingData.duration}
          />
        );
      case 1:
        return (
          <ServiceSelector
            profile={profile}
            onSelect={handleServicesSelect}
            selectedServices={bookingData.services}
            selectedExtras={bookingData.extras}
          />
        );
      case 2:
        return (
          <LocationSelector
            profile={profile}
            onSelect={handleLocationSelect}
            selectedLocation={bookingData.location}
          />
        );
      case 3:
        return (
          <BookingRequirements
            profile={profile}
            onComplete={handleRequirementsComplete}
            notes={bookingData.notes}
            specialRequests={bookingData.specialRequests}
          />
        );
      case 4:
        return (
          <PaymentForm
            profile={profile}
            bookingData={bookingData}
            onNext={handleNext}
          />
        );
      case 5:
        return (
          <BookingSummary
            profile={profile}
            bookingData={bookingData}
            onSubmit={handleSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper sx={{ mt: 3, p: { xs: 2, md: 3 } }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              mb: 4,
            }}
          >
            {t('booking.createTitle')}
          </Typography>

          <Stepper
            activeStep={activeStep}
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'vertical' : 'horizontal'}
            sx={{ mb: 4 }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{t(label)}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {validationErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>{t('validation.errors')}</AlertTitle>
              <ul>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          {renderStepContent()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              startIcon={<BackIcon />}
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              {t('common.back')}
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                endIcon={<NextIcon />}
                onClick={handleNext}
              >
                {t('common.next')}
              </Button>
            ) : null}
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default CreateBooking;