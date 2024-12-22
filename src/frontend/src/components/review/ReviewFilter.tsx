import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Rating,
  Slider,
  FormControlLabel,
  Switch,
  Button,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { ReviewFilter as ReviewFilterType, ReviewStats } from '@/types/review';

interface ReviewFilterProps {
  filters: ReviewFilterType;
  onChange: (filters: ReviewFilterType) => void;
  stats?: ReviewStats;
}

const ReviewFilter: React.FC<ReviewFilterProps> = ({
  filters,
  onChange,
  stats,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const [expanded, setExpanded] = React.useState(false);
  const [tempFilters, setTempFilters] = React.useState(filters);

  const handleChange = (key: keyof ReviewFilterType, value: any) => {
    setTempFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    onChange(tempFilters);
    setExpanded(false);
  };

  const handleReset = () => {
    const resetFilters = {
      escortId: filters.escortId,
      isPublic: true,
    };
    setTempFilters(resetFilters);
    onChange(resetFilters);
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <FilterIcon />
          <Typography>{t('review.filterTitle')}</Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            color="text.secondary"
          >
            {t('review.minRating')}
          </Typography>
          <Rating
            value={tempFilters.minRating || 0}
            onChange={(_, value) => handleChange('minRating', value)}
          />
        </Box>

        {stats?.ratingDistribution && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              color="text.secondary"
            >
              {t('review.ratingDistribution')}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                height: 100,
              }}
            >
              {Object.entries(stats.ratingDistribution)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([rating, count]) => {
                  const percentage =
                    (count / stats.totalReviews) * 100;
                  return (
                    <Box
                      key={rating}
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Typography variant="caption">
                        {rating}★
                      </Typography>
                      <Box
                        sx={{
                          height: `${percentage}%`,
                          width: '100%',
                          backgroundColor: 'primary.main',
                          borderRadius: 1,
                        }}
                      />
                      <Typography variant="caption">
                        {count}
                      </Typography>
                    </Box>
                  );
                })}
            </Box>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            gutterBottom
            color="text.secondary"
          >
            {t('review.dateRange')}
          </Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={[
                tempFilters.startDate
                  ? new Date(tempFilters.startDate).getTime()
                  : Date.now() - 30 * 24 * 60 * 60 * 1000,
                tempFilters.endDate
                  ? new Date(tempFilters.endDate).getTime()
                  : Date.now(),
              ]}
              onChange={(_, value) => {
                const [start, end] = value as number[];
                handleChange('startDate', new Date(start).toISOString());
                handleChange('endDate', new Date(end).toISOString());
              }}
              min={Date.now() - 365 * 24 * 60 * 60 * 1000}
              max={Date.now()}
              valueLabelFormat={(value) =>
                new Date(value).toLocaleDateString()
              }
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={tempFilters.isVerified}
                onChange={(e) =>
                  handleChange('isVerified', e.target.checked)
                }
              />
            }
            label={t('review.onlyVerified')}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
          }}
        >
          <Button onClick={handleReset}>
            {t('common.reset')}
          </Button>
          <Button
            variant="contained"
            onClick={handleApply}
          >
            {t('common.apply')}
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default ReviewFilter;