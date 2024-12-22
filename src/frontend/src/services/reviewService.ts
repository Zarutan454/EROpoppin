import axios from 'axios';
import {
  Review,
  ReviewRequest,
  ReviewResponseRequest,
  ReviewFilter,
  ReviewStats,
} from '@/types/review';

const API_URL = `${import.meta.env.VITE_API_URL}/reviews`;

// Bewertung erstellen
export const createReview = async (
  reviewData: ReviewRequest
): Promise<Review> => {
  const formData = new FormData();
  
  // Basis-Daten hinzufügen
  Object.entries(reviewData).forEach(([key, value]) => {
    if (key !== 'photos') {
      formData.append(key, JSON.stringify(value));
    }
  });

  // Fotos hinzufügen
  if (reviewData.photos) {
    reviewData.photos.forEach((photo) => {
      formData.append('photos', photo);
    });
  }

  const response = await axios.post(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Bewertung abrufen
export const getReview = async (reviewId: string): Promise<Review> => {
  const response = await axios.get(`${API_URL}/${reviewId}`);
  return response.data;
};

// Bewertungen filtern und abrufen
export const getReviews = async (
  filters: ReviewFilter,
  page = 1,
  limit = 10
): Promise<{
  reviews: Review[];
  total: number;
  currentPage: number;
  totalPages: number;
}> => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters,
  });

  const response = await axios.get(`${API_URL}?${queryParams}`);
  return response.data;
};

// Bewertung aktualisieren
export const updateReview = async (
  reviewId: string,
  updateData: Partial<ReviewRequest>
): Promise<Review> => {
  const formData = new FormData();

  // Basis-Daten hinzufügen
  Object.entries(updateData).forEach(([key, value]) => {
    if (key !== 'photos') {
      formData.append(key, JSON.stringify(value));
    }
  });

  // Neue Fotos hinzufügen
  if (updateData.photos) {
    updateData.photos.forEach((photo) => {
      formData.append('photos', photo);
    });
  }

  const response = await axios.patch(
    `${API_URL}/${reviewId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

// Bewertung löschen
export const deleteReview = async (reviewId: string): Promise<void> => {
  await axios.delete(`${API_URL}/${reviewId}`);
};

// Auf Bewertung antworten
export const respondToReview = async (
  reviewId: string,
  responseData: ReviewResponseRequest
): Promise<Review> => {
  const response = await axios.post(
    `${API_URL}/${reviewId}/response`,
    responseData
  );
  return response.data;
};

// Bewertungsantwort löschen
export const deleteReviewResponse = async (
  reviewId: string
): Promise<Review> => {
  const response = await axios.delete(
    `${API_URL}/${reviewId}/response`
  );
  return response.data;
};

// Bewertung melden
export const reportReview = async (
  reviewId: string,
  reason: string
): Promise<void> => {
  await axios.post(`${API_URL}/${reviewId}/report`, { reason });
};

// Bewertung genehmigen (Admin)
export const approveReview = async (reviewId: string): Promise<Review> => {
  const response = await axios.post(`${API_URL}/${reviewId}/approve`);
  return response.data;
};

// Bewertung ablehnen (Admin)
export const rejectReview = async (
  reviewId: string,
  reason: string
): Promise<Review> => {
  const response = await axios.post(`${API_URL}/${reviewId}/reject`, {
    reason,
  });
  return response.data;
};

// Bewertungsstatistiken abrufen
export const getReviewStats = async (
  escortId: string
): Promise<ReviewStats> => {
  const response = await axios.get(`${API_URL}/stats/${escortId}`);
  return response.data;
};

// Fotos aus Bewertung löschen
export const deleteReviewPhotos = async (
  reviewId: string,
  photoIds: string[]
): Promise<Review> => {
  const response = await axios.post(
    `${API_URL}/${reviewId}/photos/delete`,
    { photoIds }
  );
  return response.data;
};

// Verifizierungsstatus aktualisieren
export const updateVerificationStatus = async (
  reviewId: string,
  isVerified: boolean
): Promise<Review> => {
  const response = await axios.patch(
    `${API_URL}/${reviewId}/verification`,
    { isVerified }
  );
  return response.data;
};

// Sichtbarkeit der Bewertung ändern
export const updateReviewVisibility = async (
  reviewId: string,
  isPublic: boolean
): Promise<Review> => {
  const response = await axios.patch(
    `${API_URL}/${reviewId}/visibility`,
    { isPublic }
  );
  return response.data;
};