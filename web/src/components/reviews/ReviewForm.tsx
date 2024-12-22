'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';

interface ReviewFormProps {
  bookingId: string;
  providerId: string;
  onSubmit: (data: {
    rating: number;
    comment: string;
    bookingId: string;
    providerId: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function ReviewForm({
  bookingId,
  providerId,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSubmit({
        rating,
        comment,
        bookingId,
        providerId,
      });
    } catch (err) {
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-500/10 p-4 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Rating Stars */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">
              Rate your experience
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-500'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-400">
              {rating === 1
                ? 'Poor'
                : rating === 2
                ? 'Fair'
                : rating === 3
                ? 'Good'
                : rating === 4
                ? 'Very Good'
                : rating === 5
                ? 'Excellent'
                : 'Select a rating'}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label
              htmlFor="comment"
              className="text-sm font-medium text-gray-200"
            >
              Your Review
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-800 bg-black px-3 py-2 text-white placeholder-gray-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              placeholder="Tell others about your experience..."
            />
          </div>

          {/* Guidelines */}
          <div className="rounded-md bg-gray-800/50 p-4">
            <h4 className="text-sm font-medium text-white">Review Guidelines</h4>
            <ul className="mt-2 space-y-1 text-sm text-gray-400">
              <li>• Focus on your personal experience</li>
              <li>• Be honest and constructive</li>
              <li>• Keep it respectful and appropriate</li>
              <li>• Avoid personal information</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="justify-end space-x-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Submit Review
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}