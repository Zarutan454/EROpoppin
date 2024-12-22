import React from 'react';
import {
  Box,
  Typography,
  Divider,
  Button,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

import ReviewCard from './ReviewCard';
import ReviewFilter from './ReviewFilter';
import { Review, ReviewFilter as ReviewFilterType } from '@/types/review';
import { useReview } from '@/hooks/useReview';

interface ReviewListProps {
  escortId: string;
  onWriteReview?: () => void;
}

const ReviewList: React.FC<ReviewListProps> = ({
  escortId,
  onWriteReview,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [filters, setFilters] = React.useState<ReviewFilterType>({
    escortId,
    isPublic: true,
  });

  const {
    reviews,
    stats,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReview(filters);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 4,
          color: 'error.main',
        }}
      >
        <Typography>
          {t('review.loadError')}
        </Typography>
      </Box>
    );
  }

  if (!reviews?.pages[0].reviews.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary" gutterBottom>
          {t('review.noReviews')}
        </Typography>
        {onWriteReview && (
          <Button
            variant="contained"
            onClick={onWriteReview}
            sx={{ mt: 2 }}
          >
            {t('review.writeFirst')}
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {stats && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {t('review.stats')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr 1fr',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(6, 1fr)',
              },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4">
                {stats.totalReviews}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('review.totalReviews')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4">
                {stats.averageRating.overall.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('review.averageRating')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4">
                {stats.verifiedReviews}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('review.verifiedReviews')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4">
                {`${(stats.recommendationRate * 100).toFixed(0)}%`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('review.recommendationRate')}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <ReviewFilter
        filters={filters}
        onChange={setFilters}
        stats={stats}
      />

      <Divider sx={{ my: 3 }} />

      <AnimatePresence mode="popLayout">
        {reviews.pages.map((page, pageIndex) =>
          page.reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.2,
                delay: index * 0.05,
              }}
            >
              <ReviewCard review={review} />
              {pageIndex !== reviews.pages.length - 1 ||
                index !== page.reviews.length - 1 ? (
                <Divider sx={{ my: 3 }} />
              ) : null}
            </motion.div>
          ))
        )}
      </AnimatePresence>

      {hasNextPage && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 4,
          }}
        >
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            startIcon={
              isFetchingNextPage ? (
                <CircularProgress size={20} />
              ) : null
            }
          >
            {isFetchingNextPage
              ? t('common.loading')
              : t('review.loadMore')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ReviewList;