import axios from 'axios';
import {
  Booking,
  BookingRequest,
  BookingFilter,
  BookingStats,
  BookingSlot,
} from '@/types/booking';

const API_URL = `${import.meta.env.VITE_API_URL}/bookings`;

// Verfügbare Zeitslots abrufen
export const getAvailableSlots = async (
  escortId: string,
  date: string
): Promise<BookingSlot[]> => {
  const response = await axios.get(
    `${API_URL}/slots/${escortId}?date=${date}`
  );
  return response.data;
};

// Buchung erstellen
export const createBooking = async (
  bookingData: BookingRequest
): Promise<Booking> => {
  const response = await axios.post(API_URL, bookingData);
  return response.data;
};

// Buchung abrufen
export const getBooking = async (bookingId: string): Promise<Booking> => {
  const response = await axios.get(`${API_URL}/${bookingId}`);
  return response.data;
};

// Buchung aktualisieren
export const updateBooking = async (
  bookingId: string,
  updateData: Partial<Booking>
): Promise<Booking> => {
  const response = await axios.patch(
    `${API_URL}/${bookingId}`,
    updateData
  );
  return response.data;
};

// Buchung stornieren
export const cancelBooking = async (
  bookingId: string,
  reason: string
): Promise<void> => {
  await axios.post(`${API_URL}/${bookingId}/cancel`, { reason });
};

// Buchung bestätigen
export const confirmBooking = async (bookingId: string): Promise<void> => {
  await axios.post(`${API_URL}/${bookingId}/confirm`);
};

// Buchung ablehnen
export const rejectBooking = async (
  bookingId: string,
  reason: string
): Promise<void> => {
  await axios.post(`${API_URL}/${bookingId}/reject`, { reason });
};

// Buchung als abgeschlossen markieren
export const completeBooking = async (bookingId: string): Promise<void> => {
  await axios.post(`${API_URL}/${bookingId}/complete`);
};

// Buchungen filtern
export const getBookings = async (
  filters: BookingFilter,
  page = 1,
  limit = 10
): Promise<{
  bookings: Booking[];
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

// Buchungsstatistiken abrufen
export const getBookingStats = async (
  escortId: string,
  startDate?: string,
  endDate?: string
): Promise<BookingStats> => {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);

  const response = await axios.get(
    `${API_URL}/stats/${escortId}?${queryParams}`
  );
  return response.data;
};

// Anzahlung leisten
export const submitDeposit = async (
  bookingId: string,
  paymentMethod: string,
  amount: number
): Promise<void> => {
  await axios.post(`${API_URL}/${bookingId}/deposit`, {
    paymentMethod,
    amount,
  });
};

// Zahlung verarbeiten
export const processPayment = async (
  bookingId: string,
  paymentMethod: string,
  amount: number
): Promise<void> => {
  await axios.post(`${API_URL}/${bookingId}/payment`, {
    paymentMethod,
    amount,
  });
};

// Rückerstattung beantragen
export const requestRefund = async (
  bookingId: string,
  reason: string
): Promise<void> => {
  await axios.post(`${API_URL}/${bookingId}/refund`, { reason });
};

// Screening-Informationen einreichen
export const submitScreening = async (
  bookingId: string,
  screeningData: any
): Promise<void> => {
  await axios.post(`${API_URL}/${bookingId}/screening`, screeningData);
};

// Buchungsanfrage validieren
export const validateBookingRequest = async (
  bookingData: BookingRequest
): Promise<{
  isValid: boolean;
  errors?: string[];
}> => {
  const response = await axios.post(
    `${API_URL}/validate`,
    bookingData
  );
  return response.data;
};

// Buchungsbenachrichtigungen abrufen
export const getBookingNotifications = async (
  userId: string
): Promise<{
  pendingApproval: number;
  upcomingBookings: number;
  pendingPayments: number;
  pendingReviews: number;
}> => {
  const response = await axios.get(`${API_URL}/notifications/${userId}`);
  return response.data;
};

// Buchungspreisberechnung
export const calculateBookingPrice = async (
  bookingData: Partial<BookingRequest>
): Promise<{
  subtotal: number;
  extras: number;
  fees: number;
  total: number;
  deposit?: number;
}> => {
  const response = await axios.post(
    `${API_URL}/calculate-price`,
    bookingData
  );
  return response.data;
};