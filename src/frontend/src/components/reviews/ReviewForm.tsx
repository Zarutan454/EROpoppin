import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Rating,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ReviewRequest } from '@/types/review';
import { ImageUpload } from '../shared/ImageUpload';

const reviewSchema = z.object({
  rating: z.object({
    overall: z.number().min(1).max(5),
    communication: z.number().min(1).max(5),
    appearance: z.number().min(1).max(5),
    service: z.number().min(1).max(5),
    location: z.number().min(1).max(5),
    value: z.number().min(1).max(5),
  }),
  content: z.string().min(10).max(1000),
  isPublic: z.boolean(),
  isAnonymous: z.boolean(),
  photos: z.array(z.instanceof(File)).optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  escortId: string;
  bookingId: string;
  onSubmit: (data: ReviewRequest) => Promise<void>;
  initialValues?: Partial<ReviewFormValues>;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  escortId,
  bookingId,
  onSubmit,
  initialValues,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: {
        overall: initialValues?.rating?.overall || 0,
        communication: initialValues?.rating?.communication || 0,
        appearance: initialValues?.rating?.appearance || 0,
        service: initialValues?.rating?.service || 0,
        location: initialValues?.rating?.location || 0,
        value: initialValues?.rating?.value || 0,
      },
      content: initialValues?.content || '',
      isPublic: initialValues?.isPublic ?? true,
      isAnonymous: initialValues?.isAnonymous ?? false,
      photos: initialValues?.photos || [],
    },
  });

  const onFormSubmit = async (data: ReviewFormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit({
        ...data,
        escortId,
        bookingId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {t('reviews.form.ratings')}
              </Typography>
              <Grid container spacing={2}>
                {[
                  'overall',
                  'communication',
                  'appearance',
                  'service',
                  'location',
                  'value',
                ].map((category) => (
                  <Grid item xs={12} sm={6} key={category}>
                    <Box display="flex" alignItems="center">
                      <Typography component="legend">
                        {t(`reviews.categories.${category}`)}
                      </Typography>
                      <Controller
                        name={`rating.${category}`}
                        control={control}
                        render={({ field }) => (
                          <Rating
                            {...field}
                            precision={0.5}
                            size="large"
                          />
                        )}
                      />
                    </Box>
                    {errors.rating?.[category] && (
                      <Typography color="error" variant="caption">
                        {errors.rating[category]?.message}
                      </Typography>
                    )}
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    multiline
                    rows={4}
                    fullWidth
                    label={t('reviews.form.content')}
                    error={!!errors.content}
                    helperText={errors.content?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="photos"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <ImageUpload
                    onChange={onChange}
                    value={value}
                    maxFiles={5}
                    accept="image/*"
                    maxSize={5000000} // 5MB
                  />
                )}
              />
              {errors.photos && (
                <Typography color="error" variant="caption">
                  {errors.photos.message}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="isPublic"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                      />
                    }
                    label={t('reviews.form.isPublic')}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="isAnonymous"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                      />
                    }
                    label={t('reviews.form.isAnonymous')}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isSubmitting}
              >
                {t('reviews.form.submit')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};