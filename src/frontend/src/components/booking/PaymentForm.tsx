import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  RadioGroup,
  Radio,
  FormControlLabel,
  TextField,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  CreditCard as CreditCardIcon,
  Money as CashIcon,
  Currency as CryptoIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { EscortProfile } from '@/types/profile';
import { BookingRequest } from '@/types/booking';
import { useBooking } from '@/hooks/useBooking';
import { formatCurrency } from '@/utils/format';

interface PaymentFormProps {
  profile: EscortProfile;
  bookingData: Partial<BookingRequest>;
  onNext: () => void;
}

const PaymentForm = ({
  profile,
  bookingData,
  onNext,
}: PaymentFormProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { calculateBookingPrice } = useBooking();

  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [isCalculating, setIsCalculating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceDetails, setPriceDetails] = useState<{
    subtotal: number;
    extras: number;
    fees: number;
    total: number;
    deposit?: number;
  } | null>(null);

  useEffect(() => {
    calculatePrice();
  }, [bookingData]);

  const calculatePrice = async () => {
    setIsCalculating(true);
    setError(null);

    try {
      const details = await calculateBookingPrice(bookingData);
      setPriceDetails(details);
    } catch (error) {
      console.error('Price calculation error:', error);
      setError(t('booking.calculationError'));
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePaymentMethodChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPaymentMethod(event.target.value);
  };

  const handleSubmit = async () => {
    if (!priceDetails) return;

    try {
      // Hier würde normalerweise die Zahlungsverarbeitung stattfinden
      onNext();
    } catch (error) {
      console.error('Payment error:', error);
      setError(t('booking.paymentError'));
    }
  };

  const renderPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <CashIcon />;
      case 'creditCard':
        return <CreditCardIcon />;
      case 'bankTransfer':
        return <BankIcon />;
      case 'crypto':
        return <CryptoIcon />;
      default:
        return <PaymentIcon />;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('booking.payment')}
      </Typography>

      <Grid container spacing={3}>
        {/* Preisübersicht */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('booking.priceDetails')}
            </Typography>

            {isCalculating ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  py: 3,
                }}
              >
                <CircularProgress />
              </Box>
            ) : priceDetails ? (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={8}>
                    <Typography>{t('booking.subtotal')}</Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'right' }}>
                    <Typography>
                      {formatCurrency(priceDetails.subtotal)}
                    </Typography>
                  </Grid>

                  {priceDetails.extras > 0 && (
                    <>
                      <Grid item xs={8}>
                        <Typography>{t('booking.extras')}</Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'right' }}>
                        <Typography>
                          {formatCurrency(priceDetails.extras)}
                        </Typography>
                      </Grid>
                    </>
                  )}

                  {priceDetails.fees > 0 && (
                    <>
                      <Grid item xs={8}>
                        <Typography>{t('booking.fees')}</Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'right' }}>
                        <Typography>
                          {formatCurrency(priceDetails.fees)}
                        </Typography>
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>

                  <Grid item xs={8}>
                    <Typography variant="h6">
                      {t('booking.total')}
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(priceDetails.total)}
                    </Typography>
                  </Grid>

                  {priceDetails.deposit && (
                    <>
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <AlertTitle>
                            {t('booking.depositRequired')}
                          </AlertTitle>
                          {t('booking.depositAmount', {
                            amount: formatCurrency(priceDetails.deposit),
                          })}
                        </Alert>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            ) : null}
          </Paper>
        </Grid>

        {/* Zahlungsmethoden */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('booking.selectPaymentMethod')}
            </Typography>

            <RadioGroup
              value={paymentMethod}
              onChange={handlePaymentMethodChange}
            >
              <Grid container spacing={2}>
                {['cash', 'creditCard', 'bankTransfer', 'crypto'].map(
                  (method) => (
                    <Grid item xs={12} sm={6} key={method}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          border: '2px solid',
                          borderColor:
                            paymentMethod === method
                              ? 'primary.main'
                              : 'divider',
                        }}
                      >
                        <FormControlLabel
                          value={method}
                          control={<Radio />}
                          label={
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              {renderPaymentIcon(method)}
                              {t(`paymentMethods.${method}`)}
                            </Box>
                          }
                        />
                      </Paper>
                    </Grid>
                  )
                )}
              </Grid>
            </RadioGroup>
          </Paper>
        </Grid>

        {/* Fehleranzeige */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {/* Datenschutzhinweis */}
        <Grid item xs={12}>
          <Alert severity="info" icon={<PaymentIcon />}>
            <AlertTitle>{t('booking.paymentSecurity')}</AlertTitle>
            {t('booking.paymentSecurityText')}
          </Alert>
        </Grid>
      </Grid>

      {/* Aktionsbuttons */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isCalculating || !priceDetails}
          startIcon={<PaymentIcon />}
        >
          {t('booking.proceedToSummary')}
        </Button>
      </Box>
    </Box>
  );
};

export default PaymentForm;