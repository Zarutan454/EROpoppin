import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import {
  Review,
  ReviewRequest,
  ReviewResponseRequest,
  ReviewFilter,
  ReviewListResponse,
} from '@/types/review';

export function useReview(filter?: ReviewFilter) {
  const queryClient = useQueryClient();
  const queryKey = ['reviews', filter];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        ...filter,
      });

      const { data } = await apiClient.get<ReviewListResponse>(
        `/reviews?${params}`,
      );
      return data;
    },
    getNextPageParam: (lastPage, pages) => {
      const totalPages = Math.ceil(lastPage.total / 10);
      const nextPage = pages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (newReview: ReviewRequest) => {
      const formData = new FormData();
      Object.entries(newReview).forEach(([key, value]) => {
        if (key === 'photos') {
          value?.forEach((photo: File) => {
            formData.append('photos', photo);
          });
        } else if (key === 'rating') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string);
        }
      });

      const { data } = await apiClient.post<Review>('/reviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ReviewRequest>;
    }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'photos') {
          value?.forEach((photo: File) => {
            formData.append('photos', photo);
          });
        } else if (key === 'rating') {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, value as string);
        }
      });

      const { data: response } = await apiClient.put<Review>(
        `/reviews/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const respondToReviewMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ReviewResponseRequest;
    }) => {
      const { data: response } = await apiClient.post<Review>(
        `/reviews/${id}/respond`,
        data,
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const createReview = useCallback(
    (data: ReviewRequest) => createReviewMutation.mutateAsync(data),
    [createReviewMutation],
  );

  const updateReview = useCallback(
    (id: string, data: Partial<ReviewRequest>) =>
      updateReviewMutation.mutateAsync({ id, data }),
    [updateReviewMutation],
  );

  const deleteReview = useCallback(
    (id: string) => deleteReviewMutation.mutateAsync(id),
    [deleteReviewMutation],
  );

  const respondToReview = useCallback(
    (id: string, data: ReviewResponseRequest) =>
      respondToReviewMutation.mutateAsync({ id, data }),
    [respondToReviewMutation],
  );

  return {
    reviews: data,
    stats: data?.pages[0].stats,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    createReview,
    updateReview,
    deleteReview,
    respondToReview,
  };
}
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import * as reviewService from '@/services/reviewService';
import {
  Review,
  ReviewRequest,
  ReviewResponseRequest,
  ReviewFilter,
  ReviewStats,
} from '@/types/review';
import { useAuth } from './useAuth';

export const useReview = (reviewId?: string) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [uploadProgress, setUploadProgress] = useState(0);

  // Einzelne Bewertung abrufen
  const {
    data: review,
    isLoading,
    error,
    refetch,
  } = useQuery<Review>(
    ['review', reviewId],
    () => reviewService.getReview(reviewId!),
    {
      enabled: !!reviewId,
      staleTime: 1000 * 60, // 1 Minute
    }
  );

  // Bewertung erstellen
  const createMutation = useMutation(
    (data: ReviewRequest) => reviewService.createReview(data),
    {
      onSuccess: (newReview) => {
        queryClient.setQueryData(['review', newReview.id], newReview);
        queryClient.invalidateQueries(['reviews']);
        enqueueSnackbar(t('review.createSuccess'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('review.createError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Bewertung aktualisieren
  const updateMutation = useMutation(
    (data: { id: string; updateData: Partial<ReviewRequest> }) =>
      reviewService.updateReview(data.id, data.updateData),
    {
      onSuccess: (updatedReview) => {
        queryClient.setQueryData(['review', updatedReview.id], updatedReview);
        queryClient.invalidateQueries(['reviews']);
        enqueueSnackbar(t('review.updateSuccess'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('review.updateError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Bewertung löschen
  const deleteMutation = useMutation(
    (id: string) => reviewService.deleteReview(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reviews']);
        enqueueSnackbar(t('review.deleteSuccess'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('review.deleteError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Auf Bewertung antworten
  const respondMutation = useMutation(
    (data: { reviewId: string; response: ReviewResponseRequest }) =>
      reviewService.respondToReview(data.reviewId, data.response),
    {
      onSuccess: (updatedReview) => {
        queryClient.setQueryData(['review', updatedReview.id], updatedReview);
        queryClient.invalidateQueries(['reviews']);
        enqueueSnackbar(t('review.responseSuccess'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('review.responseError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Bewertung melden
  const reportMutation = useMutation(
    (data: { id: string; reason: string }) =>
      reviewService.reportReview(data.id, data.reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['review', reviewId]);
        enqueueSnackbar(t('review.reportSuccess'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('review.reportError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Bewertung genehmigen (Admin)
  const approveMutation = useMutation(
    (id: string) => reviewService.approveReview(id),
    {
      onSuccess: (updatedReview) => {
        queryClient.setQueryData(['review', updatedReview.id], updatedReview);
        queryClient.invalidateQueries(['reviews']);
        enqueueSnackbar(t('review.approveSuccess'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('review.approveError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Bewertung ablehnen (Admin)
  const rejectMutation = useMutation(
    (data: { id: string; reason: string }) =>
      reviewService.rejectReview(data.id, data.reason),
    {
      onSuccess: (updatedReview) => {
        queryClient.setQueryData(['review', updatedReview.id], updatedReview);
        queryClient.invalidateQueries(['reviews']);
        enqueueSnackbar(t('review.rejectSuccess'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('review.rejectError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Fotos löschen
  const deletePhotosMutation = useMutation(
    (data: { reviewId: string; photoIds: string[] }) =>
      reviewService.deleteReviewPhotos(data.reviewId, data.photoIds),
    {
      onSuccess: (updatedReview) => {
        queryClient.setQueryData(['review', updatedReview.id], updatedReview);
        queryClient.invalidateQueries(['reviews']);
        enqueueSnackbar(t('review.deletePhotosSuccess'), {
          variant: 'success',
        });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('review.deletePhotosError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Wrapper-Funktionen für einfachere Verwendung
  const createReview = async (data: ReviewRequest) => {
    return createMutation.mutateAsync(data);
  };

  const updateReview = async (
    id: string,
    updateData: Partial<ReviewRequest>
  ) => {
    return updateMutation.mutateAsync({ id, updateData });
  };

  const deleteReview = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const respondToReview = async (
    reviewId: string,
    response: ReviewResponseRequest
  ) => {
    return respondMutation.mutateAsync({ reviewId, response });
  };

  const reportReview = async (id: string, reason: string) => {
    return reportMutation.mutateAsync({ id, reason });
  };

  const approveReview = async (id: string) => {
    return approveMutation.mutateAsync(id);
  };

  const rejectReview = async (id: string, reason: string) => {
    return rejectMutation.mutateAsync({ id, reason });
  };

  const deleteReviewPhotos = async (
    reviewId: string,
    photoIds: string[]
  ) => {
    return deletePhotosMutation.mutateAsync({ reviewId, photoIds });
  };

  return {
    review,
    isLoading,
    error,
    refetch,
    uploadProgress,
    createReview,
    updateReview,
    deleteReview,
    respondToReview,
    reportReview,
    approveReview,
    rejectReview,
    deleteReviewPhotos,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isResponding: respondMutation.isLoading,
    isReporting: reportMutation.isLoading,
    isApproving: approveMutation.isLoading,
    isRejecting: rejectMutation.isLoading,
    isDeletingPhotos: deletePhotosMutation.isLoading,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    respondError: respondMutation.error,
    reportError: reportMutation.error,
    approveError: approveMutation.error,
    rejectError: rejectMutation.error,
    deletePhotosError: deletePhotosMutation.error,
  };
};