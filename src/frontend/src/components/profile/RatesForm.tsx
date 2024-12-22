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
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  InputAdornment,
  useTheme,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { EscortProfile, Rate } from '@/types/profile';
import { durationOptions } from '@/utils/options';
import { formatCurrency, formatDuration } from '@/utils/format';

interface RatesFormProps {
  profile: EscortProfile;
  onSave: (data: Partial<EscortProfile>) => Promise<void>;
  isSaving: boolean;
}

const RatesForm = ({ profile, onSave, isSaving }: RatesFormProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [rates, setRates] = useState<Rate[]>(profile.rates || []);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const validationSchema = Yup.object({
    duration: Yup.number()
      .required(t('validation.required'))
      .min(30, t('validation.durationMin'))
      .max(1440, t('validation.durationMax')),
    price: Yup.number()
      .required(t('validation.required'))
      .min(0, t('validation.priceMin')),
    description: Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      duration: 60,
      price: '',
      description: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      const newRate: Rate = {
        id: editingRate?.id || `rate-${Date.now()}`,
        duration: Number(values.duration),
        price: Number(values.price),
        description: values.description,
      };

      let updatedRates;
      if (editingRate) {
        updatedRates = rates.map((rate) =>
          rate.id === editingRate.id ? newRate : rate
        );
      } else {
        updatedRates = [...rates, newRate];
      }

      setRates(updatedRates);
      formik.resetForm();
      setEditingRate(null);
      setIsAdding(false);
    },
  });

  const handleEdit = (rate: Rate) => {
    setEditingRate(rate);
    formik.setValues({
      duration: rate.duration,
      price: rate.price.toString(),
      description: rate.description || '',
    });
    setIsAdding(true);
  };

  const handleDelete = (rateId: string) => {
    setRates(rates.filter((rate) => rate.id !== rateId));
  };

  const handleSave = async () => {
    await onSave({ rates });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('profile.rates')}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Tarif-Liste */}
        <List>
          <AnimatePresence>
            {rates
              .sort((a, b) => a.duration - b.duration)
              .map((rate) => (
                <motion.div
                  key={rate.id}
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
                            onClick={() => handleEdit(rate)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton
                            edge="end"
                            onClick={() => handleDelete(rate.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <AccessTimeIcon color="primary" />
                          {formatDuration(rate.duration)}
                          <Typography
                            variant="h6"
                            color="primary"
                            sx={{ ml: 'auto' }}
                          >
                            {formatCurrency(rate.price)}
                          </Typography>
                        </Box>
                      }
                      secondary={rate.description}
                    />
                  </ListItem>
                </motion.div>
              ))}
          </AnimatePresence>
        </List>

        {/* Tarif hinzufügen/bearbeiten Form */}
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
                    select
                    name="duration"
                    label={t('profile.duration')}
                    value={formik.values.duration}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.duration &&
                      Boolean(formik.errors.duration)
                    }
                    helperText={
                      formik.touched.duration && formik.errors.duration
                    }
                  >
                    {durationOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {t(option.label)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="price"
                    label={t('profile.price')}
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
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="description"
                    label={t('profile.description')}
                    multiline
                    rows={2}
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
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button onClick={() => {
                      setIsAdding(false);
                      setEditingRate(null);
                      formik.resetForm();
                    }}>
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={formik.isSubmitting}
                    >
                      {editingRate
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
            onClick={() => setIsAdding(true)}
            sx={{ mt: 2 }}
          >
            {t('profile.addRate')}
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

export default RatesForm;