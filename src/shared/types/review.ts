export interface ReviewRating {
  overall: number;
  communication: number;
  appearance: number;
  service: number;
  location: number;
  value: number;
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  escortId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  escortId: string;
  clientId: string;
  bookingId: string;
  rating: ReviewRating;
  content: string;
  photos?: string[];
  isPublic: boolean;
  isAnonymous: boolean;
  isVerified: boolean;
  response?: ReviewResponse;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRequest {
  escortId: string;
  bookingId: string;
  rating: ReviewRating;
  content: string;
  photos?: File[];
  isPublic: boolean;
  isAnonymous: boolean;
}

export interface ReviewResponseRequest {
  content: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: ReviewRating;
  verifiedReviews: number;
  recommendationRate: number;
  ratingDistribution: Record<number, number>;
}

export interface ReviewFilter {
  escortId: string;
  clientId?: string;
  bookingId?: string;
  minRating?: number;
  startDate?: string;
  endDate?: string;
  isVerified?: boolean;
  isPublic?: boolean;
}

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  stats?: ReviewStats;
}