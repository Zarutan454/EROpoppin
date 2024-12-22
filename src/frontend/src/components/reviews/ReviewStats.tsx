import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Rating,
  LinearProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ReviewStatsProps {
  stats: {
    totalReviews: number;
    averageRating: {
      overall: number;
      communication: number;
      appearance: number;
      service: number;
      location: number;
      value: number;
    };
    verifiedReviews: number;
    recommendationRate: number;
    ratingDistribution: Record<number, number>;
  };
}

export const ReviewStats: React.FC<ReviewStatsProps> = ({ stats }) => {
  const { t } = useTranslation();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {stats.averageRating.overall.toFixed(1)}
          </Typography>
          <Rating
            value={stats.averageRating.overall}
            precision={0.5}
            readOnly
            size="large"
          />
          <Typography variant="body2" color="textSecondary">
            {t('reviews.stats.basedOn', { count: stats.totalReviews })}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('reviews.stats.verifiedCount', {
              count: stats.verifiedReviews,
              total: stats.totalReviews,
            })}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ mt: 1 }}
          >
            {t('reviews.stats.recommendationRate', {
              rate: (stats.recommendationRate * 100).toFixed(0),
            })}
          </Typography>
        </Box>
      </Grid>

      <Grid item xs={12} md={4}>
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            {t('reviews.stats.detailedRatings')}
          </Typography>
          {Object.entries(stats.averageRating).map(([category, rating]) => (
            category !== 'overall' && (
              <Box key={category} sx={{ mb: 1 }}>
                <Typography variant="body2" gutterBottom>
                  {t(`reviews.categories.${category}`)}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Rating value={rating} readOnly size="small" />
                  <Typography variant="body2">
                    {rating.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
            )
          ))}
        </Box>
      </Grid>

      <Grid item xs={12} md={4}>
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            {t('reviews.stats.ratingDistribution')}
          </Typography>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating] || 0;
            const percentage = stats.totalReviews > 0
              ? (count / stats.totalReviews) * 100
              : 0;

            return (
              <Box key={rating} sx={{ mb: 1 }}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography variant="body2" minWidth={20}>
                    {rating}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{ flexGrow: 1 }}
                  />
                  <Typography variant="body2" minWidth={40}>
                    {count}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Grid>
    </Grid>
  );
};