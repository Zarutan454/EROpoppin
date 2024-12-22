import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Rating,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  IconButton,
  Grid,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Image as ImageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { motion, AnimatePresence } from 'framer-motion';

import { ReviewRequest, ReviewRating } from '@/types/review';
import { useReview } from '@/hooks/useReview';

interface ReviewFormProps {
  escortId: string;
  bookingId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  escortId,
  bookingId,
  onSuccess,
  onCancel,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { createReview } = useReview();

  const [rating, setRating] = useState<ReviewRating>({
    overall: 0,
    communication: 0,
    appearance: 0,
    service: 0,
    location: 0,
    value: 0,
  });

  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        enqueueSnackbar(t('review.onlyImages'), { variant: 'error' });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        enqueueSnackbar(t('review.imageTooLarge'), { variant: 'error' });
        return false;
      }
      return true;
    });

    if (photos.length + validFiles.length > 5) {
      enqueueSnackbar(t('review.maxImages'), { variant: 'error' });
      return;
    }

    setPhotos([...photos, ...validFiles]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating.overall === 0) {
      enqueueSnackbar(t('review.ratingRequired'), { variant: 'error' });
      return;
    }

    if (!content.trim()) {
      enqueueSnackbar(t('review.contentRequired'), { variant: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const reviewData: ReviewRequest = {
        escortId,
        bookingId,
        rating,
        content: content.trim(),
        photos,
        isPublic,
        isAnonymous,
      };

      await createReview(reviewData);
      enqueueSnackbar(t('review.submitSuccess'), { variant: 'success' });
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      enqueueSnackbar(
        error.response?.data?.message || t('review.submitError'),
        { variant: 'error' }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t('review.writeReview')}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('review.overallRating')}
        </Typography>
        <Rating
          size="large"
          value={rating.overall}
          onChange={(_, value) =>
            setRating({ ...rating, overall: value || 0 })
          }
        />
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" gutterBottom>
            {t('review.communication')}
          </Typography>
          <Rating
            value={rating.communication}
            onChange={(_, value) =>
              setRating({ ...rating, communication: value || 0 })
            }
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" gutterBottom>
            {t('review.appearance')}
          </Typography>
          <Rating
            value={rating.appearance}
            onChange={(_, value) =>
              setRating({ ...rating, appearance: value || 0 })
            }
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" gutterBottom>
            {t('review.service')}
          </Typography>
          <Rating
            value={rating.service}
            onChange={(_, value) =>
              setRating({ ...rating, service: value || 0 })
            }
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" gutterBottom>
            {t('review.location')}
          </Typography>
          <Rating
            value={rating.location}
            onChange={(_, value) =>
              setRating({ ...rating, location: value || 0 })
            }
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" gutterBottom>
            {t('review.value')}
          </Typography>
          <Rating
            value={rating.value}
            onChange={(_, value) =>
              setRating({ ...rating, value: value || 0 })
            }
          />
        </Grid>
      </Grid>

      <TextField
        fullWidth
        multiline
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('review.contentPlaceholder')}
        sx={{ mb: 3 }}
      />

      <Box sx={{ mb: 3 }}>
        <input
          type="file"
          id="review-photos"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoSelect}
        />
        <label htmlFor="review-photos">
          <Button
            component="span"
            variant="outlined"
            startIcon={<ImageIcon />}
            disabled={photos.length >= 5}
          >
            {t('review.addPhotos')}
          </Button>
        </label>
        <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
          {t('review.maxPhotosInfo')}
        </Typography>

        <Grid container spacing={1} sx={{ mt: 1 }}>
          <AnimatePresence>
            {photos.map((photo, index) => (
              <Grid item key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: 100,
                      height: 100,
                    }}
                  >
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: theme.shape.borderRadius,
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removePhoto(index)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          }
          label={t('review.makePublic')}
        />
        <FormControlLabel
          control={
            <Switch
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
          }
          label={t('review.stayAnonymous')}
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {t('review.submit')}
        </Button>
      </Box>
    </Paper>
  );
};

export default ReviewForm;