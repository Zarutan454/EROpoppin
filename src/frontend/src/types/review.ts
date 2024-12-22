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
  content: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
}

export interface Review {
  id: string;
  escortId: string;
  clientId: string;
  bookingId: string;
  rating: ReviewRating;
  content: string;
  photos?: string[];
  isVerified: boolean;
  isPublic: boolean;
  isAnonymous: boolean;
  response?: ReviewResponse;
  status: 'pending' | 'approved' | 'rejected' | 'reported';
  reportReason?: string;
  verificationInfo?: {
    bookingDate: string;
    bookingType: string;
    duration: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: ReviewRating;
  verifiedReviews: number;
  totalPhotos: number;
  responseRate: number;
  recommendationRate: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

export interface ReviewFilter {
  escortId?: string;
  clientId?: string;
  status?: string;
  isVerified?: boolean;
  isPublic?: boolean;
  minRating?: number;
  maxRating?: number;
  startDate?: string;
  endDate?: string;
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
  reviewId: string;
  content: string;
  isPublic: boolean;
}