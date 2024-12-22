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
  Place as PlaceIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { GoogleMap, MarkerF, LoadScript } from '@react-google-maps/api';

import { EscortProfile, Location } from '@/types/profile';

interface LocationsFormProps {
  profile: EscortProfile;
  onSave: (data: Partial<EscortProfile>) => Promise<void>;
  isSaving: boolean;
}

const LocationsForm = ({ profile, onSave, isSaving }: LocationsFormProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [locations, setLocations] = useState<Location[]>(profile.locations || []);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const validationSchema = Yup.object({
    city: Yup.string().required(t('validation.required')),
    country: Yup.string().required(t('validation.required')),
    travelDistance: Yup.number()
      .min(0, t('validation.travelDistanceMin'))
      .nullable(),
  });

  const formik = useFormik({
    initialValues: {
      city: '',
      country: '',
      travelDistance: '',
      inCall: true,
      outCall: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      const newLocation: Location = {
        id: editingLocation?.id || `location-${Date.now()}`,
        city: values.city,
        country: values.country,
        travelDistance: values.travelDistance
          ? Number(values.travelDistance)
          : undefined,
        inCall: values.inCall,
        outCall: values.outCall,
      };

      let updatedLocations;
      if (editingLocation) {
        updatedLocations = locations.map((location) =>
          location.id === editingLocation.id ? newLocation : location
        );
      } else {
        updatedLocations = [...locations, newLocation];
      }

      setLocations(updatedLocations);
      formik.resetForm();
      setEditingLocation(null);
      setIsAdding(false);
      setSelectedPosition(null);
    },
  });

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setSelectedPosition({ lat, lng });

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results[0]) {
        const addressComponents = data.results[0].address_components;
        let city = '';
        let country = '';

        for (const component of addressComponents) {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
        }

        formik.setFieldValue('city', city);
        formik.setFieldValue('country', country);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    formik.setValues({
      city: location.city,
      country: location.country,
      travelDistance: location.travelDistance?.toString() || '',
      inCall: location.inCall,
      outCall: location.outCall,
    });
    setIsAdding(true);
  };

  const handleDelete = (locationId: string) => {
    setLocations(locations.filter((location) => location.id !== locationId));
  };

  const handleSave = async () => {
    await onSave({ locations });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('profile.locations')}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Karte */}
        <Box sx={{ height: 400, mb: 3 }}>
          <LoadScript googleMapsApiKey={process.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={{ lat: 51.1657, lng: 10.4515 }} // Deutschland
              zoom={6}
              onClick={handleMapClick}
            >
              {selectedPosition && (
                <MarkerF position={selectedPosition} />
              )}
              {locations.map((location) => (
                // Hier müssten die Koordinaten aus der Location kommen
                <MarkerF
                  key={location.id}
                  position={{ lat: 0, lng: 0 }} // Dummy-Koordinaten
                  onClick={() => handleEdit(location)}
                />
              ))}
            </GoogleMap>
          </LoadScript>
        </Box>

        {/* Standort-Liste */}
        <List>
          <AnimatePresence>
            {locations.map((location) => (
              <motion.div
                key={location.id}
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
                          onClick={() => handleEdit(location)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.delete')}>
                        <IconButton
                          edge="end"
                          onClick={() => handleDelete(location.id)}
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
                        <PlaceIcon color="primary" />
                        {`${location.city}, ${location.country}`}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {location.travelDistance && (
                          <Chip
                            label={t('profile.travelDistance', {
                              distance: location.travelDistance,
                            })}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                        )}
                        {location.inCall && (
                          <Chip
                            label={t('profile.inCall')}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                        )}
                        {location.outCall && (
                          <Chip
                            label={t('profile.outCall')}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </List>

        {/* Standort hinzufügen/bearbeiten Form */}
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
                    name="city"
                    label={t('profile.city')}
                    value={formik.values.city}
                    onChange={formik.handleChange}
                    error={formik.touched.city && Boolean(formik.errors.city)}
                    helperText={formik.touched.city && formik.errors.city}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="country"
                    label={t('profile.country')}
                    value={formik.values.country}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.country && Boolean(formik.errors.country)
                    }
                    helperText={formik.touched.country && formik.errors.country}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="travelDistance"
                    label={t('profile.travelDistance')}
                    type="number"
                    value={formik.values.travelDistance}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.travelDistance &&
                      Boolean(formik.errors.travelDistance)
                    }
                    helperText={
                      formik.touched.travelDistance &&
                      formik.errors.travelDistance
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">km</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="inCall"
                          checked={formik.values.inCall}
                          onChange={formik.handleChange}
                        />
                      }
                      label={t('profile.inCall')}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          name="outCall"
                          checked={formik.values.outCall}
                          onChange={formik.handleChange}
                        />
                      }
                      label={t('profile.outCall')}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button onClick={() => {
                      setIsAdding(false);
                      setEditingLocation(null);
                      formik.resetForm();
                    }}>
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={formik.isSubmitting}
                    >
                      {editingLocation
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
            {t('profile.addLocation')}
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

export default LocationsForm;