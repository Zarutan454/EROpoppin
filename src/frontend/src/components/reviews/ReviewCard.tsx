import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Rating,
  Chip,
  IconButton,
  Button,
  Dialog,
  Menu,
  MenuItem,
  Grid,
  ImageList,
  ImageListItem,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  CheckCircle as VerifiedIcon,
  Person as AnonymousIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Review } from '@/types/review';
import { ImageGallery } from '../shared/ImageGallery';

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  onRespond?: (reviewId: string) => void;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  currentUserId,
  onRespond,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit?.(review);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete?.(review.id);
  };

  const isOwner = currentUserId === review.clientId;
  const canRespond = currentUserId === review.escortId && !review.response;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1">
              {review.isAnonymous
                ? t('reviews.anonymous')
                : review.client?.displayName}
            </Typography>
            {review.isVerified && (
              <Chip
                icon={<VerifiedIcon />}
                label={t('reviews.verified')}
                size="small"
                color="primary"
              />
            )}
            {review.isAnonymous && (
              <Chip
                icon={<AnonymousIcon />}
                label={t('reviews.anonymous')}
                size="small"
              />
            )}
          </Box>
          
          {(isOwner || canRespond) && (
            <>
              <IconButton onClick={handleMenuClick}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                {isOwner && (
                  <>
                    <MenuItem onClick={handleEdit}>
                      {t('common.edit')}
                    </MenuItem>
                    <MenuItem onClick={handleDelete}>
                      {t('common.delete')}
                    </MenuItem>
                  </>
                )}
                {canRespond && (
                  <MenuItem onClick={() => onRespond?.(review.id)}>
                    {t('reviews.respond')}
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Box>

        <Grid container spacing={2}>
          {Object.entries(review.rating).map(([category, value]) => (
            <Grid item xs={12} sm={6} key={category}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography component="legend">
                  {t(`reviews.categories.${category}`)}
                </Typography>
                <Rating value={value} readOnly precision={0.5} />
              </Box>
            </Grid>
          ))}
        </Grid>

        <Typography variant="body1" mt={2}>
          {review.content}
        </Typography>

        {review.photos && review.photos.length > 0 && (
          <Box mt={2}>
            <ImageList cols={4} gap={8}>
              {review.photos.map((photo, index) => (
                <ImageListItem
                  key={index}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setSelectedImage(photo)}
                >
                  <img
                    src={photo}
                    alt={`Review photo ${index + 1}`}
                    loading="lazy"
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}

        <Typography variant="caption" color="textSecondary" mt={2} display="block">
          {format(new Date(review.createdAt), 'PPP')}
        </Typography>

        {review.response && (
          <Box mt={2} bgcolor="action.hover" p={2} borderRadius={1}>
            <Typography variant="subtitle2" gutterBottom>
              {t('reviews.response.title')}
            </Typography>
            <Typography variant="body2">
              {review.response.content}
            </Typography>
            <Typography variant="caption" color="textSecondary" mt={1} display="block">
              {format(new Date(review.response.createdAt), 'PPP')}
            </Typography>
          </Box>
        )}
      </CardContent>

      <ImageGallery
        images={review.photos || []}
        selectedImage={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </Card>
  );
};