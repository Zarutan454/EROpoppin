import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Rating,
  Chip,
  Button,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  PhotoCamera as PhotoIcon,
  Verified as VerifiedIcon,
  Report as ReportIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { Review, ReviewResponse } from '../../types/review';

interface ReviewListProps {
  reviews: Review[];
  onRespondToReview?: (reviewId: string, content: string) => void;
  onReportReview?: (reviewId: string, reason: string) => void;
  onDeleteReview?: (reviewId: string) => void;
  canRespond?: boolean;
  canModerate?: boolean;
}

const ReviewCard: React.FC<{
  review: Review;
  onRespond?: (content: string) => void;
  onReport?: (reason: string) => void;
  onDelete?: () => void;
  canRespond?: boolean;
  canModerate?: boolean;
}> = ({
  review,
  onRespond,
  onReport,
  onDelete,
  canRespond,
  canModerate,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  const [reportReason, setReportReason] = useState('');

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleResponseSubmit = () => {
    if (onRespond) {
      onRespond(responseContent);
      setResponseContent('');
    }
    setResponseDialogOpen(false);
  };

  const handleReportSubmit = () => {
    if (onReport) {
      onReport(reportReason);
      setReportReason('');
    }
    setReportDialogOpen(false);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={review.user?.avatar} alt={review.user?.name} />
            <Box sx={{ ml: 1 }}>
              <Typography variant="subtitle1">
                {review.user?.name}
                {review.isVerified && (
                  <VerifiedIcon
                    color="primary"
                    sx={{ ml: 0.5, width: 16, height: 16 }}
                  />
                )}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {formatDistanceToNow(new Date(review.createdAt), {
                  addSuffix: true,
                })}
              </Typography>
            </Box>
          </Box>

          {(canRespond || canModerate) && (
            <>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                {canRespond && (
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      setResponseDialogOpen(true);
                    }}
                  >
                    Respond
                  </MenuItem>
                )}
                {canModerate && (
                  <MenuItem onClick={onDelete}>Delete Review</MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    setReportDialogOpen(true);
                  }}
                >
                  Report
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Rating value={review.rating.overall} readOnly precision={0.5} />
          <Typography variant="body1" sx={{ mt: 1 }}>
            {review.content}
          </Typography>
        </Box>

        {review.photos && review.photos.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {review.photos.map((photo, index) => (
              <Box
                key={index}
                component="img"
                src={photo}
                alt={`Review photo ${index + 1}`}
                sx={{
                  width: 100,
                  height: 100,
                  objectFit: 'cover',
                  borderRadius: 1,
                }}
              />
            ))}
          </Box>
        )}

        {review.responses && review.responses.length > 0 && (
          <Box sx={{ mt: 2, pl: 2, borderLeft: 2, borderColor: 'divider' }}>
            {review.responses.map((response) => (
              <Box key={response.id} sx={{ mt: 1 }}>
                <Typography variant="subtitle2" color="primary">
                  Response from host
                </Typography>
                <Typography variant="body2">{response.content}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatDistanceToNow(new Date(response.createdAt), {
                    addSuffix: true,
                  })}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>

      {/* Response Dialog */}
      <Dialog
        open={responseDialogOpen}
        onClose={() => setResponseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Respond to Review</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            placeholder="Write your response..."
            value={responseContent}
            onChange={(e) => setResponseContent(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleResponseSubmit}
            variant="contained"
            disabled={!responseContent.trim()}
          >
            Submit Response
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report Review</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            placeholder="Please provide the reason for reporting this review..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReportSubmit}
            variant="contained"
            color="error"
            disabled={!reportReason.trim()}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  onRespondToReview,
  onReportReview,
  onDeleteReview,
  canRespond,
  canModerate,
}) => {
  return (
    <Box>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          onRespond={
            onRespondToReview
              ? (content) => onRespondToReview(review.id, content)
              : undefined
          }
          onReport={
            onReportReview
              ? (reason) => onReportReview(review.id, reason)
              : undefined
          }
          onDelete={
            onDeleteReview ? () => onDeleteReview(review.id) : undefined
          }
          canRespond={canRespond}
          canModerate={canModerate}
        />
      ))}
    </Box>
  );
};

export default ReviewList;

import { useState } from 'react';
import Image from 'next/image';
import { Star, ThumbsUp, Flag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  likes: number;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  isLiked?: boolean;
}

interface ReviewListProps {
  reviews: Review[];
  onLike?: (reviewId: string) => Promise<void>;
  onReport?: (reviewId: string) => Promise<void>;
}

export function ReviewList({ reviews, onLike, onReport }: ReviewListProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [loadingLikes, setLoadingLikes] = useState<Set<string>>(new Set());
  const [loadingReports, setLoadingReports] = useState<Set<string>>(new Set());

  const toggleExpand = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const handleLike = async (reviewId: string) => {
    if (!onLike || loadingLikes.has(reviewId)) return;

    setLoadingLikes((prev) => new Set([...prev, reviewId]));
    try {
      await onLike(reviewId);
    } finally {
      setLoadingLikes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  const handleReport = async (reviewId: string) => {
    if (!onReport || loadingReports.has(reviewId)) return;

    setLoadingReports((prev) => new Set([...prev, reviewId]));
    try {
      await onReport(reviewId);
    } finally {
      setLoadingReports((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="p-6">
          <div className="flex space-x-4">
            <div className="flex-shrink-0">
              <Image
                src={
                  review.author.avatar_url ||
                  `https://api.dicebear.com/6.x/avataaars/svg?seed=${review.author.username}`
                }
                alt={review.author.full_name}
                width={48}
                height={48}
                className="rounded-full"
              />
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">
                    {review.author.full_name}
                  </h4>
                  <div className="mt-1 flex items-center space-x-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-gray-500'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {onLike && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(review.id)}
                      disabled={loadingLikes.has(review.id)}
                      className={`${
                        review.isLiked ? 'text-pink-500' : 'text-gray-400'
                      }`}
                    >
                      <ThumbsUp className="mr-1 h-4 w-4" />
                      {review.likes}
                    </Button>
                  )}
                  {onReport && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReport(review.id)}
                      disabled={loadingReports.has(review.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <p
                  className={`text-gray-300 ${
                    !expandedReviews.has(review.id) &&
                    review.comment.length > 300
                      ? 'line-clamp-3'
                      : ''
                  }`}
                >
                  {review.comment}
                </p>
                {review.comment.length > 300 && (
                  <button
                    onClick={() => toggleExpand(review.id)}
                    className="mt-2 text-sm text-pink-500 hover:text-pink-400"
                  >
                    {expandedReviews.has(review.id)
                      ? 'Show less'
                      : 'Read more'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}