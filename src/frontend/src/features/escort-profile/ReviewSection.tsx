import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewResponseDialog } from '@/components/reviews/ReviewResponseDialog';
import { useReview } from '@/hooks/useReview';
import { useAuth } from '@/hooks/useAuth';
import { useBookings } from '@/hooks/useBookings';
import { Review } from '@/types/review';

interface ReviewSectionProps {
  escortId: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ escortId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const {
    reviews,
    stats,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    createReview,
    updateReview,
    deleteReview,
    respondToReview,
  } = useReview({
    escortId,
    isPublic: true,
  });

  const { data: bookings } = useBookings({
    escortId,
    clientId: user?.id,
    status: 'completed',
  });

  const canReview = bookings?.some(
    (booking) =>
      !reviews?.pages.some((page) =>
        page.reviews.some((review) => review.bookingId === booking.id)
      )
  );

  const handleReviewSubmit = async (data) => {
    const booking = bookings?.find(
      (b) =>
        !reviews?.pages.some((page) =>
          page.reviews.some((review) => review.bookingId === b.id)
        )
    );

    if (booking) {
      await createReview({
        ...data,
        bookingId: booking.id,
      });
      setShowReviewForm(false);
    }
  };

  const handleReviewUpdate = async (data) => {
    if (editingReview) {
      await updateReview(editingReview.id, data);
      setEditingReview(null);
    }
  };

  const handleReviewDelete = async (reviewId: string) => {
    if (window.confirm(t('common.confirmDelete'))) {
      await deleteReview(reviewId);
    }
  };

  const handleResponseSubmit = async (data) => {
    if (selectedReview) {
      await respondToReview(selectedReview, data);
      setSelectedReview(null);
    }
  };

  const reviewListData = reviews?.pages.flatMap((page) => page.reviews) ?? [];

  return (
    <Box>
      {canReview && !showReviewForm && (
        <Box mb={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowReviewForm(true)}
          >
            {t('reviews.writeReview')}
          </Button>
        </Box>
      )}

      {showReviewForm && (
        <Box mb={3}>
          <ReviewForm
            escortId={escortId}
            onSubmit={handleReviewSubmit}
          />
          <Box mt={2}>
            <Button
              variant="outlined"
              onClick={() => setShowReviewForm(false)}
            >
              {t('common.cancel')}
            </Button>
          </Box>
        </Box>
      )}

      {editingReview && (
        <Box mb={3}>
          <ReviewForm
            escortId={escortId}
            onSubmit={handleReviewUpdate}
            initialValues={editingReview}
          />
          <Box mt={2}>
            <Button
              variant="outlined"
              onClick={() => setEditingReview(null)}
            >
              {t('common.cancel')}
            </Button>
          </Box>
        </Box>
      )}

      <ReviewList
        reviews={reviewListData}
        stats={stats}
        isLoading={isLoading}
        error={error}
        hasMore={hasNextPage}
        onLoadMore={() => fetchNextPage()}
        isLoadingMore={isFetchingNextPage}
        currentUserId={user?.id}
        onRespond={setSelectedReview}
        onEdit={setEditingReview}
        onDelete={handleReviewDelete}
      />

      <ReviewResponseDialog
        open={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        onSubmit={handleResponseSubmit}
      />
    </Box>
  );
};