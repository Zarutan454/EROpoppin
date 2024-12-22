import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  Divider,
  Alert,
  Button,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

import { EscortProfile } from '@/types/profile';
import { formatCurrency, formatDuration } from '@/utils/format';

interface ServiceSelectorProps {
  profile: EscortProfile;
  onSelect: (services: string[], extras?: string[]) => void;
  selectedServices?: string[];
  selectedExtras?: string[];
}

const ServiceSelector = ({
  profile,
  onSelect,
  selectedServices = [],
  selectedExtras = [],
}: ServiceSelectorProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [services, setServices] = useState<string[]>(selectedServices);
  const [extras, setExtras] = useState<string[]>(selectedExtras);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    calculateTotal();
  }, [services, extras]);

  const handleServiceToggle = (serviceId: string) => {
    const updatedServices = services.includes(serviceId)
      ? services.filter((id) => id !== serviceId)
      : [...services, serviceId];

    setServices(updatedServices);
    onSelect(updatedServices, extras);
  };

  const handleExtraToggle = (extraId: string) => {
    const updatedExtras = extras.includes(extraId)
      ? extras.filter((id) => id !== extraId)
      : [...extras, extraId];

    setExtras(updatedExtras);
    onSelect(services, updatedExtras);
  };

  const calculateTotal = () => {
    const servicesTotal = services.reduce((sum, serviceId) => {
      const service = profile.services.find((s) => s.id === serviceId);
      return sum + (service?.price || 0);
    }, 0);

    const extrasTotal = extras.reduce((sum, extraId) => {
      const extra = profile.services
        .flatMap((s) => s.extras || [])
        .find((e) => e.id === extraId);
      return sum + (extra?.price || 0);
    }, 0);

    setTotal(servicesTotal + extrasTotal);
  };

  const isServiceAvailable = (serviceId: string) => {
    const service = profile.services.find((s) => s.id === serviceId);
    return service?.isAvailable;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('booking.selectServices')}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Hauptservices */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              {t('booking.services')}
            </Typography>
            <FormGroup>
              <AnimatePresence>
                {profile.services.map((service) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        mb: 1,
                        border: '1px solid',
                        borderColor: services.includes(service.id)
                          ? 'primary.main'
                          : 'divider',
                        opacity: service.isAvailable ? 1 : 0.5,
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={services.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            disabled={!service.isAvailable}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="subtitle2">
                              {service.name}
                              {!service.isAvailable && (
                                <Chip
                                  label={t('common.unavailable')}
                                  size="small"
                                  color="error"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              {service.description}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mt: 1,
                                gap: 1,
                              }}
                            >
                              <Chip
                                label={formatCurrency(service.price)}
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label={formatDuration(service.duration)}
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </Paper>
                  </motion.div>
                ))}
              </AnimatePresence>
            </FormGroup>
          </Grid>

          {/* Extras */}
          {profile.services.some((service) => service.extras?.length > 0) && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  {t('booking.extras')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormGroup>
                  <Grid container spacing={2}>
                    {profile.services
                      .flatMap((service) => service.extras || [])
                      .filter(
                        (extra, index, self) =>
                          index ===
                          self.findIndex((e) => e.id === extra.id)
                      )
                      .map((extra) => (
                        <Grid item xs={12} sm={6} md={4} key={extra.id}>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              border: '1px solid',
                              borderColor: extras.includes(extra.id)
                                ? 'primary.main'
                                : 'divider',
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={extras.includes(extra.id)}
                                  onChange={() => handleExtraToggle(extra.id)}
                                  disabled={
                                    !services.some((serviceId) =>
                                      isServiceAvailable(serviceId)
                                    )
                                  }
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="subtitle2">
                                    {extra.name}
                                  </Typography>
                                  <Chip
                                    label={formatCurrency(extra.price)}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mt: 1 }}
                                  />
                                </Box>
                              }
                            />
                          </Paper>
                        </Grid>
                      ))}
                  </Grid>
                </FormGroup>
              </Grid>
            </>
          )}

          {/* Gesamtsumme */}
          <Grid item xs={12}>
            <Box
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                borderRadius: 1,
                textAlign: 'right',
              }}
            >
              <Typography variant="subtitle1">
                {t('booking.total')}:{' '}
                <Typography
                  component="span"
                  variant="h5"
                  sx={{ fontWeight: 'bold' }}
                >
                  {formatCurrency(total)}
                </Typography>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {services.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('booking.selectServicePrompt')}
        </Alert>
      )}
    </Box>
  );
};

export default ServiceSelector;