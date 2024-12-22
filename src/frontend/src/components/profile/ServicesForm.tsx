import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  TextField,
  IconButton,
  Switch,
  FormControlLabel,
  InputAdornment,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { EscortProfile, Service } from '@/types/profile';
import { formatCurrency } from '@/utils/format';

interface ServicesFormProps {
  profile: EscortProfile;
  onSave: (data: Partial<EscortProfile>) => Promise<void>;
  isSaving: boolean;
}

const ServicesForm = ({ profile, onSave, isSaving }: ServicesFormProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [services, setServices] = useState<Service[]>(profile.services || []);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required(t('validation.required')),
    description: Yup.string(),
    price: Yup.number()
      .required(t('validation.required'))
      .min(0, t('validation.priceMin')),
    duration: Yup.number()
      .required(t('validation.required'))
      .min(30, t('validation.durationMin'))
      .max(480, t('validation.durationMax')),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      price: '',
      duration: 60,
      isAvailable: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      const newService: Service = {
        id: editingService?.id || `service-${Date.now()}`,
        name: values.name,
        description: values.description,
        price: Number(values.price),
        duration: Number(values.duration),
        isAvailable: values.isAvailable,
      };

      let updatedServices;
      if (editingService) {
        updatedServices = services.map((service) =>
          service.id === editingService.id ? newService : service
        );
      } else {
        updatedServices = [...services, newService];
      }

      setServices(updatedServices);
      formik.resetForm();
      setEditingService(null);
      setIsAdding(false);
    },
  });

  const handleEdit = (service: Service) => {
    setEditingService(service);
    formik.setValues({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration,
      isAvailable: service.isAvailable,
    });
    setIsAdding(true);
  };

  const handleDelete = (serviceId: string) => {
    setServices(services.filter((service) => service.id !== serviceId));
  };

  const handleAddNew = () => {
    formik.resetForm();
    setEditingService(null);
    setIsAdding(true);
  };

  const handleCancel = () => {
    formik.resetForm();
    setEditingService(null);
    setIsAdding(false);
  };

  const handleSave = async () => {
    await onSave({ services });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('profile.services')}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Service-Liste */}
        <List>
          <AnimatePresence>
            {services.map((service) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <ListItem
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title={t('common.edit')}>
                        <IconButton
                          edge="end"
                          onClick={() => handleEdit(service)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.delete')}>
                        <IconButton
                          edge="end"
                          onClick={() => handleDelete(service.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {service.name}
                        {!service.isAvailable && (
                          <Chip
                            label={t('profile.unavailable')}
                            size="small"
                            color="error"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {service.description}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="primary"
                          sx={{ mt: 0.5 }}
                        >
                          {formatCurrency(service.price)} • {service.duration}{' '}
                          {t('profile.minutes')}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </List>

        {/* Service hinzufügen/bearbeiten Form */}
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Box
              component="form"
              onSubmit={formik.handleSubmit}
              sx={{ mt: 3 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="name"
                    label={t('profile.serviceName')}
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="description"
                    label={t('profile.serviceDescription')}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.description &&
                      Boolean(formik.errors.description)
                    }
                    helperText={
                      formik.touched.description && formik.errors.description
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="price"
                    label={t('profile.servicePrice')}
                    type="number"
                    value={formik.values.price}
                    onChange={formik.handleChange}
                    error={formik.touched.price && Boolean(formik.errors.price)}
                    helperText={formik.touched.price && formik.errors.price}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">€</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="duration"
                    label={t('profile.serviceDuration')}
                    type="number"
                    value={formik.values.duration}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.duration && Boolean(formik.errors.duration)
                    }
                    helperText={formik.touched.duration && formik.errors.duration}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {t('profile.minutes')}
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="isAvailable"
                        checked={formik.values.isAvailable}
                        onChange={formik.handleChange}
                      />
                    }
                    label={t('profile.serviceAvailable')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button onClick={handleCancel}>
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={formik.isSubmitting}
                    >
                      {editingService
                        ? t('common.update')
                        : t('common.add')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        )}

        {/* Hinzufügen Button */}
        {!isAdding && (
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{ mt: 2 }}
          >
            {t('profile.addService')}
          </Button>
        )}
      </Paper>

      {/* Speichern Button */}
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

export default ServicesForm;