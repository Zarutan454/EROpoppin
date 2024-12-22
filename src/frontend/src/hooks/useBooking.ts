import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import * as bookingService from '@/services/bookingService';
import {
  Booking,
  BookingRequest,
  BookingFilter,
  BookingStats,
} from '@/types/booking';
import { useAuth } from './useAuth';

export const useBooking = (bookingId?: string) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Buchung abrufen
  const {
    data: booking,
    isLoading,
    error,
    refetch,
  } = useQuery<Booking>(
    ['booking', bookingId],
    () => bookingService.getBooking(bookingId!),
    {
      enabled: !!bookingId,
      staleTime: 1000 * 60, // 1 Minute
    }
  );

  // Buchung erstellen
  const createMutation = useMutation(
    (data: BookingRequest) => bookingService.createBooking(data),
    {
      onSuccess: (newBooking) => {
        queryClient.setQueryData(['booking', newBooking.id], newBooking);
        enqueueSnackbar(t('booking.createSuccess'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('booking.createError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Buchung aktualisieren
  const updateMutation = useMutation(
    (data: { id: string; updateData: Partial<Booking> }) =>
      bookingService.updateBooking(data.id, data.updateData),
    {
      onSuccess: (updatedBooking) => {
        queryClient.setQueryData(
          ['booking', updatedBooking.id],
          updatedBooking
        );
        enqueueSnackbar(t('booking.updateSuccess'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('booking.updateError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Buchung stornieren
  const cancelMutation = useMutation(
    (data: { id: string; reason: string }) =>
      bookingService.cancelBooking(data.id, data.reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['booking', bookingId]);
        enqueueSnackbar(t('booking.cancelSuccess'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('booking.cancelError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Buchung bestätigen
  const confirmMutation = useMutation(
    (id: string) => bookingService.confirmBooking(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['booking', bookingId]);
        enqueueSnackbar(t('booking.confirmSuccess'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('booking.confirmError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Buchung ablehnen
  const rejectMutation = useMutation(
    (data: { id: string; reason: string }) =>
      bookingService.rejectBooking(data.id, data.reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['booking', bookingId]);
        enqueueSnackbar(t('booking.rejectSuccess'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('booking.rejectError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Anzahlung leisten
  const depositMutation = useMutation(
    (data: { id: string; paymentMethod: string; amount: number }) =>
      bookingService.submitDeposit(
        data.id,
        data.paymentMethod,
        data.amount
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['booking', bookingId]);
        enqueueSnackbar(t('booking.depositSuccess'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('booking.depositError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Zahlung verarbeiten
  const paymentMutation = useMutation(
    (data: { id: string; paymentMethod: string; amount: number }) =>
      bookingService.processPayment(
        data.id,
        data.paymentMethod,
        data.amount
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['booking', bookingId]);
        enqueueSnackbar(t('booking.paymentSuccess'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('booking.paymentError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Wrapper-Funktionen für einfachere Verwendung
  const createBooking = async (data: BookingRequest) => {
    return createMutation.mutateAsync(data);
  };

  const updateBooking = async (
    id: string,
    updateData: Partial<Booking>
  ) => {
    return updateMutation.mutateAsync({ id, updateData });
  };

  const cancelBooking = async (id: string, reason: string) => {
    return cancelMutation.mutateAsync({ id, reason });
  };

  const confirmBooking = async (id: string) => {
    return confirmMutation.mutateAsync(id);
  };

  const rejectBooking = async (id: string, reason: string) => {
    return rejectMutation.mutateAsync({ id, reason });
  };

  const submitDeposit = async (
    id: string,
    paymentMethod: string,
    amount: number
  ) => {
    return depositMutation.mutateAsync({ id, paymentMethod, amount });
  };

  const processPayment = async (
    id: string,
    paymentMethod: string,
    amount: number
  ) => {
    return paymentMutation.mutateAsync({ id, paymentMethod, amount });
  };

  return {
    booking,
    isLoading,
    error,
    refetch,
    createBooking,
    updateBooking,
    cancelBooking,
    confirmBooking,
    rejectBooking,
    submitDeposit,
    processPayment,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isCancelling: cancelMutation.isLoading,
    isConfirming: confirmMutation.isLoading,
    isRejecting: rejectMutation.isLoading,
    isProcessingDeposit: depositMutation.isLoading,
    isProcessingPayment: paymentMutation.isLoading,
    createError: createMutation.error,
    updateError: updateMutation.error,
    cancelError: cancelMutation.error,
    confirmError: confirmMutation.error,
    rejectError: rejectMutation.error,
    depositError: depositMutation.error,
    paymentError: paymentMutation.error,
  };
};