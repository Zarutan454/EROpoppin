import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

import * as profileService from '@/services/profileService';
import { EscortProfile, ProfileUpdateDto } from '@/types/profile';
import { useAuth } from './useAuth';

export const useProfile = (userId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profileId = userId || user?.id;

  // Profile abrufen
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery<EscortProfile>(
    ['profile', profileId],
    () => profileService.getProfile(profileId!),
    {
      enabled: !!profileId,
      staleTime: 1000 * 60 * 5, // 5 Minuten
    }
  );

  // Profile aktualisieren
  const updateMutation = useMutation(
    (data: { userId: string; updateData: ProfileUpdateDto }) =>
      profileService.updateProfile(data.userId, data.updateData),
    {
      onSuccess: (updatedProfile) => {
        queryClient.setQueryData(['profile', profileId], updatedProfile);
      },
    }
  );

  // Bilder hochladen
  const uploadImageMutation = useMutation(
    (data: { userId: string; file: File }) =>
      profileService.uploadProfileImage(data.userId, data.file),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', profileId]);
      },
    }
  );

  // Bild löschen
  const deleteImageMutation = useMutation(
    (data: { userId: string; imageId: string }) =>
      profileService.deleteProfileImage(data.userId, data.imageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', profileId]);
      },
    }
  );

  // Hauptbild festlegen
  const setMainImageMutation = useMutation(
    (data: { userId: string; imageId: string }) =>
      profileService.setMainProfileImage(data.userId, data.imageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', profileId]);
      },
    }
  );

  // Verfügbarkeit aktualisieren
  const updateAvailabilityMutation = useMutation(
    (data: { userId: string; availability: any[] }) =>
      profileService.updateAvailability(data.userId, data.availability),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', profileId]);
      },
    }
  );

  // Services aktualisieren
  const updateServicesMutation = useMutation(
    (data: { userId: string; services: any[] }) =>
      profileService.updateServices(data.userId, data.services),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', profileId]);
      },
    }
  );

  // Preise aktualisieren
  const updateRatesMutation = useMutation(
    (data: { userId: string; rates: any[] }) =>
      profileService.updateRates(data.userId, data.rates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', profileId]);
      },
    }
  );

  // Standorte aktualisieren
  const updateLocationsMutation = useMutation(
    (data: { userId: string; locations: any[] }) =>
      profileService.updateLocations(data.userId, data.locations),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', profileId]);
      },
    }
  );

  // Profil verifizieren
  const verifyProfileMutation = useMutation(
    (data: { userId: string; documentType: string; file: File }) =>
      profileService.verifyProfile(data.userId, data.documentType, data.file),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', profileId]);
      },
    }
  );

  // Profil aktivieren/deaktivieren
  const toggleActivationMutation = useMutation(
    (data: { userId: string; isActive: boolean }) =>
      profileService.toggleProfileActivation(data.userId, data.isActive),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', profileId]);
      },
    }
  );

  // Wrapper-Funktionen für einfachere Verwendung
  const updateProfile = async (userId: string, data: ProfileUpdateDto) => {
    return updateMutation.mutateAsync({ userId, updateData: data });
  };

  const uploadImage = async (userId: string, file: File) => {
    return uploadImageMutation.mutateAsync({ userId, file });
  };

  const deleteImage = async (userId: string, imageId: string) => {
    return deleteImageMutation.mutateAsync({ userId, imageId });
  };

  const setMainImage = async (userId: string, imageId: string) => {
    return setMainImageMutation.mutateAsync({ userId, imageId });
  };

  const updateAvailability = async (userId: string, availability: any[]) => {
    return updateAvailabilityMutation.mutateAsync({ userId, availability });
  };

  const updateServices = async (userId: string, services: any[]) => {
    return updateServicesMutation.mutateAsync({ userId, services });
  };

  const updateRates = async (userId: string, rates: any[]) => {
    return updateRatesMutation.mutateAsync({ userId, rates });
  };

  const updateLocations = async (userId: string, locations: any[]) => {
    return updateLocationsMutation.mutateAsync({ userId, locations });
  };

  const verifyProfile = async (
    userId: string,
    documentType: string,
    file: File
  ) => {
    return verifyProfileMutation.mutateAsync({ userId, documentType, file });
  };

  const toggleActivation = async (userId: string, isActive: boolean) => {
    return toggleActivationMutation.mutateAsync({ userId, isActive });
  };

  return {
    profile,
    isLoading,
    error,
    refetch,
    updateProfile,
    uploadImage,
    deleteImage,
    setMainImage,
    updateAvailability,
    updateServices,
    updateRates,
    updateLocations,
    verifyProfile,
    toggleActivation,
    isUpdating: updateMutation.isLoading,
    isUploading: uploadImageMutation.isLoading,
    isDeleting: deleteImageMutation.isLoading,
    updateError: updateMutation.error,
    uploadError: uploadImageMutation.error,
    deleteError: deleteImageMutation.error,
  };
};