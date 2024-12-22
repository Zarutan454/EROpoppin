'use client';

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