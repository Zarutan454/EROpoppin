import axios from 'axios';
import { EscortProfile, ProfileUpdateDto, ProfileImage } from '@/types/profile';

const API_URL = `${import.meta.env.VITE_API_URL}/profiles`;

export const getProfile = async (userId: string): Promise<EscortProfile> => {
  const response = await axios.get(`${API_URL}/${userId}`);
  return response.data;
};

export const updateProfile = async (
  userId: string,
  data: ProfileUpdateDto
): Promise<EscortProfile> => {
  const response = await axios.patch(`${API_URL}/${userId}`, data);
  return response.data;
};

export const uploadProfileImage = async (
  userId: string,
  file: File
): Promise<ProfileImage> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await axios.post(
    `${API_URL}/${userId}/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

export const deleteProfileImage = async (
  userId: string,
  imageId: string
): Promise<void> => {
  await axios.delete(`${API_URL}/${userId}/images/${imageId}`);
};

export const setMainProfileImage = async (
  userId: string,
  imageId: string
): Promise<void> => {
  await axios.patch(`${API_URL}/${userId}/images/${imageId}/main`);
};

export const updateAvailability = async (
  userId: string,
  availability: any[]
): Promise<void> => {
  await axios.put(`${API_URL}/${userId}/availability`, { availability });
};

export const updateServices = async (
  userId: string,
  services: any[]
): Promise<void> => {
  await axios.put(`${API_URL}/${userId}/services`, { services });
};

export const updateRates = async (
  userId: string,
  rates: any[]
): Promise<void> => {
  await axios.put(`${API_URL}/${userId}/rates`, { rates });
};

export const updateLocations = async (
  userId: string,
  locations: any[]
): Promise<void> => {
  await axios.put(`${API_URL}/${userId}/locations`, { locations });
};

export const getProfileReviews = async (
  userId: string,
  page = 1,
  limit = 10
): Promise<{
  reviews: any[];
  total: number;
  currentPage: number;
  totalPages: number;
}> => {
  const response = await axios.get(
    `${API_URL}/${userId}/reviews?page=${page}&limit=${limit}`
  );
  return response.data;
};

export const submitReview = async (
  userId: string,
  data: {
    rating: number;
    comment: string;
  }
): Promise<void> => {
  await axios.post(`${API_URL}/${userId}/reviews`, data);
};

export const verifyProfile = async (
  userId: string,
  documentType: string,
  file: File
): Promise<void> => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('documentType', documentType);

  await axios.post(`${API_URL}/${userId}/verify`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const toggleProfileActivation = async (
  userId: string,
  isActive: boolean
): Promise<void> => {
  await axios.patch(`${API_URL}/${userId}/activation`, { isActive });
};

export const reportProfile = async (
  userId: string,
  reason: string,
  details: string
): Promise<void> => {
  await axios.post(`${API_URL}/${userId}/report`, { reason, details });
};

export const getProfileStats = async (userId: string): Promise<{
  viewCount: number;
  favoriteCount: number;
  contactCount: number;
  averageRating: number;
  totalReviews: number;
}> => {
  const response = await axios.get(`${API_URL}/${userId}/stats`);
  return response.data;
};

export const searchProfiles = async (params: {
  page?: number;
  limit?: number;
  location?: string;
  service?: string;
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  profiles: EscortProfile[];
  total: number;
  currentPage: number;
  totalPages: number;
}> => {
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const response = await axios.get(`${API_URL}/search?${queryString}`);
  return response.data;
};