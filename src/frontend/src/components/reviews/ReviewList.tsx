import React from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Button,
  Paper,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Review } from '@/types/review';
import { ReviewCard } from './ReviewCard';
import { ReviewStats } from './ReviewStats';

interface ReviewListProps {
  reviews: Review[];
  stats?: {
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
  isLoading?: boolean;
  error?: Error;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  currentUserId?: string;
  onRespond?: (reviewId: string) => void;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  stats,
  isLoading,
  error,
  hasMore,
  onLoadMore,
  isLoadingMore,
  currentUserId,
  onRespond,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error" align="center">
          {error.message}
        </Typography>
      </Box>
    );
  }

  if (!reviews.length) {
    return (
      <Box p={4}>
        <Typography align="center" color="textSecondary">
          {t('reviews.list.noReviews')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {stats && (
        <Paper sx={{ mb: 3, p: 3 }}>
          <ReviewStats stats={stats} />
        </Paper>
      )}
      
      <Grid container spacing={3}>
        {reviews.map((review) => (
          <Grid item xs={12} key={review.id}>
            <ReviewCard
              review={review}
              currentUserId={currentUserId}
              onRespond={onRespond}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Grid>
        ))}
      </Grid>

      {hasMore && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            variant="outlined"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <CircularProgress size={24} />
            ) : (
              t('reviews.list.loadMore')
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
};