import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Typography,
  Autocomplete,
  IconButton,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { debounce } from 'lodash';
import { useSearchParams } from 'react-router-dom';
import { EscortProfile, PhysicalAttributes } from '../../types/profile';

interface SearchFilters {
  location?: string;
  ageRange: [number, number];
  priceRange: [number, number];
  services: string[];
  gender?: string;
  availability?: 'now' | 'today' | 'week' | null;
  verified?: boolean;
  hasReviews?: boolean;
  attributes?: Partial<PhysicalAttributes>;
  languages?: string[];
}

export const AdvancedSearch: React.FC = () => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    ageRange: [18, 99],
    priceRange: [0, 1000],
    services: [],
  });
  const [searchResults, setSearchResults] = useState<EscortProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    // Load saved filters from URL
    const urlFilters = Object.fromEntries(searchParams.entries());
    if (Object.keys(urlFilters).length > 0) {
      setFilters({
        ...filters,
        ...urlFilters,
        ageRange: urlFilters.ageRange ? JSON.parse(urlFilters.ageRange) : filters.ageRange,
        priceRange: urlFilters.priceRange ? JSON.parse(urlFilters.priceRange) : filters.priceRange,
        services: urlFilters.services ? JSON.parse(urlFilters.services) : filters.services,
      });
    }
  }, []);

  const performSearch = debounce(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();
      setSearchResults(results);

      // Update URL with current filters
      setSearchParams({
        ...filters,
        ageRange: JSON.stringify(filters.ageRange),
        priceRange: JSON.stringify(filters.priceRange),
        services: JSON.stringify(filters.services),
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, 500);

  useEffect(() => {
    performSearch();
  }, [filters]);

  const fetchLocations = async (query: string) => {
    try {
      const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  return (
    <Card>
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Autocomplete
                fullWidth
                freeSolo
                options={locations}
                value={filters.location || ''}
                onChange={(_, value) => setFilters({ ...filters, location: value || undefined })}
                onInputChange={(_, value) => fetchLocations(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Location"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <LocationOnIcon />,
                    }}
                  />
                )}
              />
              <IconButton
                onClick={() => setShowAdvanced(!showAdvanced)}
                color={showAdvanced ? 'primary' : 'default'}
              >
                <FilterListIcon />
              </IconButton>
            </Box>
          </Grid>

          {showAdvanced && (
            <>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Age Range</Typography>
                <Slider
                  value={filters.ageRange}
                  onChange={(_, value) => setFilters({ ...filters, ageRange: value as [number, number] })}
                  valueLabelDisplay="auto"
                  min={18}
                  max={99}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Price Range</Typography>
                <Slider
                  value={filters.priceRange}
                  onChange={(_, value) => setFilters({ ...filters, priceRange: value as [number, number] })}
                  valueLabelDisplay="auto"
                  min={0}
                  max={1000}
                  step={50}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={filters.gender || ''}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="transgender">Transgender</MenuItem>
                    <MenuItem value="non-binary">Non-binary</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Availability</InputLabel>
                  <Select
                    value={filters.availability || ''}
                    onChange={(e) => setFilters({ ...filters, availability: e.target.value as any })}
                  >
                    <MenuItem value="">Any time</MenuItem>
                    <MenuItem value="now">Available now</MenuItem>
                    <MenuItem value="today">Available today</MenuItem>
                    <MenuItem value="week">Available this week</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  value={filters.services}
                  onChange={(_, value) => setFilters({ ...filters, services: value })}
                  options={[
                    'Massage',
                    'BDSM',
                    'Companionship',
                    'Roleplay',
                    'Fetish',
                    'Travel Companion',
                  ]}
                  renderInput={(params) => (
                    <TextField {...params} label="Services" placeholder="Select services" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option} {...getTagProps({ index })} />
                    ))
                  }
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {showAdvanced && (
                <Button
                  variant="outlined"
                  onClick={() => setFilters({
                    ageRange: [18, 99],
                    priceRange: [0, 1000],
                    services: [],
                  })}
                >
                  Reset Filters
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => performSearch()}
                disabled={loading}
              >
                Search
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};