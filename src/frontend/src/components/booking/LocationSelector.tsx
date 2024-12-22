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
  Alert,
  Collapse,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Place as PlaceIcon,
  Home as HomeIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadScript, GoogleMap, MarkerF } from '@react-google-maps/api';

import { EscortProfile } from '@/types/profile';

interface LocationSelectorProps {
  profile: EscortProfile;
  onSelect: (location: {
    type: 'incall' | 'outcall';
    address?: string;
    city: string;
  }) => void;
  selectedLocation?: {
    type: 'incall' | 'outcall';
    address?: string;
    city: string;
  };
}

const LocationSelector = ({
  profile,
  onSelect,
  selectedLocation,
}: LocationSelectorProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [locationType, setLocationType] = useState<'incall' | 'outcall'>(
    selectedLocation?.type || 'incall'
  );
  const [address, setAddress] = useState(selectedLocation?.address || '');
  const [city, setCity] = useState(selectedLocation?.city || '');
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Google Maps Konfiguration
  const mapContainerStyle = {
    width: '100%',
    height: '300px',
  };

  const defaultCenter = {
    lat: 51.1657,
    lng: 10.4515,
  };

  useEffect(() => {
    if (selectedLocation) {
      setLocationType(selectedLocation.type);
      setAddress(selectedLocation.address || '');
      setCity(selectedLocation.city);
    }
  }, [selectedLocation]);

  const handleLocationTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const type = event.target.value as 'incall' | 'outcall';
    setLocationType(type);
    updateLocation(type, address, city);
  };

  const handleAddressChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newAddress = event.target.value;
    setAddress(newAddress);
    updateLocation(locationType, newAddress, city);
  };

  const handleCityChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newCity = event.target.value;
    setCity(newCity);
    updateLocation(locationType, address, newCity);
  };

  const updateLocation = (
    type: 'incall' | 'outcall',
    address: string,
    city: string
  ) => {
    const location = {
      type,
      ...(type === 'outcall' && address ? { address } : {}),
      city,
    };
    onSelect(location);
  };

  const geocodeAddress = async () => {
    if (!address || !city) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          `${address}, ${city}`
        )}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results[0]) {
        setCoordinates({
          lat: data.results[0].geometry.location.lat,
          lng: data.results[0].geometry.location.lng,
        });
        setError(null);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setError(t('booking.locationError'));
    }
  };

  useEffect(() => {
    if (locationType === 'outcall' && address && city) {
      geocodeAddress();
    }
  }, [address, city]);

  const validateLocation = () => {
    if (locationType === 'incall') {
      return profile.locations.some(
        (location) => location.inCall && location.city === city
      );
    } else {
      return profile.locations.some(
        (location) =>
          location.outCall &&
          location.city === city &&
          (!location.travelDistance ||
            // Hier würde normalerweise die Entfernung zur eingegebenen Adresse geprüft
            true)
      );
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('booking.selectLocation')}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Ortstyp-Auswahl */}
          <Grid item xs={12}>
            <RadioGroup
              value={locationType}
              onChange={handleLocationTypeChange}
            >
              <Grid container spacing={2}>
                {profile.locations.some((l) => l.inCall) && (
                  <Grid item xs={12} sm={6}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        border: '2px solid',
                        borderColor:
                          locationType === 'incall'
                            ? 'primary.main'
                            : 'divider',
                      }}
                    >
                      <FormControlLabel
                        value="incall"
                        control={<Radio />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <HomeIcon sx={{ mr: 1 }} />
                            {t('booking.incall')}
                          </Box>
                        }
                      />
                    </Paper>
                  </Grid>
                )}
                {profile.locations.some((l) => l.outCall) && (
                  <Grid item xs={12} sm={6}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        border: '2px solid',
                        borderColor:
                          locationType === 'outcall'
                            ? 'primary.main'
                            : 'divider',
                      }}
                    >
                      <FormControlLabel
                        value="outcall"
                        control={<Radio />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CarIcon sx={{ mr: 1 }} />
                            {t('booking.outcall')}
                          </Box>
                        }
                      />
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </RadioGroup>
          </Grid>

          {/* Verfügbare Städte */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              {t('booking.availableCities')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profile.locations
                .filter((l) =>
                  locationType === 'incall' ? l.inCall : l.outCall
                )
                .map((location) => (
                  <Chip
                    key={location.id}
                    label={location.city}
                    icon={<PlaceIcon />}
                    onClick={() => setCity(location.city)}
                    color={city === location.city ? 'primary' : 'default'}
                    variant={city === location.city ? 'filled' : 'outlined'}
                  />
                ))}
            </Box>
          </Grid>

          {/* Adressformular für Outcall */}
          <Grid item xs={12}>
            <Collapse in={locationType === 'outcall'}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('booking.address')}
                    value={address}
                    onChange={handleAddressChange}
                    disabled={locationType !== 'outcall'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('booking.city')}
                    value={city}
                    onChange={handleCityChange}
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Grid>

          {/* Karte */}
          {coordinates && locationType === 'outcall' && (
            <Grid item xs={12}>
              <LoadScript
                googleMapsApiKey={
                  process.env.VITE_GOOGLE_MAPS_API_KEY || ''
                }
              >
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={coordinates}
                  zoom={14}
                >
                  <MarkerF position={coordinates} />
                </GoogleMap>
              </LoadScript>
            </Grid>
          )}

          {/* Validierungsfehler */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          {/* Entfernungshinweis */}
          {locationType === 'outcall' &&
            profile.locations
              .filter((l) => l.outCall && l.city === city)
              .map(
                (location) =>
                  location.travelDistance && (
                    <Grid item xs={12} key={location.id}>
                      <Alert severity="info">
                        {t('booking.travelDistance', {
                          distance: location.travelDistance,
                        })}
                      </Alert>
                    </Grid>
                  )
              )}
        </Grid>
      </Paper>

      {/* Hilfetext */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {locationType === 'incall'
            ? t('booking.incallInfo')
            : t('booking.outcallInfo')}
        </Typography>
      </Box>
    </Box>
  );
};

export default LocationSelector;