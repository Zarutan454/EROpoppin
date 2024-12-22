import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Avatar,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Chip,
  useTheme,
  ImageList,
  ImageListItem,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  CheckCircle as VerifiedIcon,
  Flag as ReportIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { Review } from '@/types/review';
import { useAuth } from '@/hooks/useAuth';
import { useReview } from '@/hooks/useReview';

interface ReviewCardProps {
  review: Review;
  onEdit?: () => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onEdit,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { deleteReview, reportReview, respondToReview } = useReview();

  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [reportDialogOpen, setReportDialogOpen] = React.useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = React.useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleDelete = async () => {
    if (window.confirm(t('review.confirmDelete'))) {
      try {
        await deleteReview(review.id);
      } catch (error) {
        console.error('Error deleting review:', error);
      }
    }
    handleMenuClose();
  };

  const handleReport = () => {
    setReportDialogOpen(true);
    handleMenuClose();
  };

  const handleResponse = () => {
    setResponseDialogOpen(true);
    handleMenuClose();
  };

  const isOwner = user?.id === review.clientId;
  const isEscort = user?.id === review.escortId;

  return (
    <Card
      component={motion.div}
      layout
      sx={{
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Avatar
            src={review.isAnonymous ? undefined : review.clientId}
            alt={review.isAnonymous ? 'Anonymous' : 'Client'}
          />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1">
                {review.isAnonymous
                  ? t('review.anonymous')
                  : t('review.clientName')}
              </Typography>
              {review.isVerified && (
                <Chip
                  icon={<VerifiedIcon />}
                  label={t('review.verified')}
                  size="small"
                  color="primary"
                />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(review.createdAt), 'PPP', {
                locale: de,
              })}
            </Typography>
          </Box>

          <IconButton onClick={handleMenuClick}>
            <MoreIcon />
          </IconButton>

          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            {isOwner && (
              <MenuItem onClick={onEdit}>
                <EditIcon sx={{ mr: 1 }} />
                {t('common.edit')}
              </MenuItem>
            )}
            {isOwner && (
              <MenuItem onClick={handleDelete}>
                <DeleteIcon sx={{ mr: 1 }} />
                {t('common.delete')}
              </MenuItem>
            )}
            {isEscort && !review.response && (
              <MenuItem onClick={handleResponse}>
                <ReplyIcon sx={{ mr: 1 }} />
                {t('review.respond')}
              </MenuItem>
            )}
            {!isOwner && !isEscort && (
              <MenuItem onClick={handleReport}>
                <ReportIcon sx={{ mr: 1 }} />
                {t('common.report')}
              </MenuItem>
            )}
          </Menu>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Rating value={review.rating.overall} readOnly />
            <Typography variant="h6">
              {review.rating.overall.toFixed(1)}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('review.communication')}
              </Typography>
              <Rating value={review.rating.communication} size="small" readOnly />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('review.appearance')}
              </Typography>
              <Rating value={review.rating.appearance} size="small" readOnly />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('review.service')}
              </Typography>
              <Rating value={review.rating.service} size="small" readOnly />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('review.location')}
              </Typography>
              <Rating value={review.rating.location} size="small" readOnly />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('review.value')}
              </Typography>
              <Rating value={review.rating.value} size="small" readOnly />
            </Box>
          </Box>
        </Box>

        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            mb: review.photos?.length ? 2 : 0,
          }}
        >
          {review.content}
        </Typography>

        {review.photos && review.photos.length > 0 && (
          <ImageList
            sx={{
              gridTemplateColumns:
                'repeat(auto-fill, minmax(100px, 1fr)) !important',
              gap: '8px !important',
            }}
          >
            {review.photos.map((photo, index) => (
              <ImageListItem
                key={index}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
                onClick={() => window.open(photo, '_blank')}
              >
                <img
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  loading="lazy"
                  style={{
                    borderRadius: theme.shape.borderRadius,
                    aspectRatio: '1',
                    objectFit: 'cover',
                  }}
                />
              </ImageListItem>
            ))}
          </ImageList>
        )}

        {review.response && (
          <Box
            sx={{
              mt: 2,
              pl: 2,
              borderLeft: `2px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              {t('review.response')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {review.response.content}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(review.response.createdAt), 'PPP', {
                locale: de,
              })}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewCard;