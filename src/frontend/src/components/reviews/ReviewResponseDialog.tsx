import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ReviewResponseRequest } from '@/types/review';

interface ReviewResponseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ReviewResponseRequest) => Promise<void>;
}

export const ReviewResponseDialog: React.FC<ReviewResponseDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError(t('reviews.response.errors.required'));
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({ content });
      handleClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('reviews.response.title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t('reviews.response.content')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            error={!!error}
            helperText={error}
            disabled={isSubmitting}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={isSubmitting}
        >
          {t('common.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};