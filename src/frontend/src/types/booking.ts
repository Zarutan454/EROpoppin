export interface BookingSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface BookingLocation {
  id: string;
  type: 'incall' | 'outcall';
  address?: string;
  city: string;
  instructions?: string;
}

export interface BookingService {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export interface BookingExtras {
  id: string;
  name: string;
  price: number;
}

export interface PaymentDetails {
  method: 'cash' | 'creditCard' | 'bankTransfer' | 'crypto';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paymentDate?: string;
}

export interface DepositPayment {
  amount: number;
  currency: string;
  paymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentDate: string;
}

export interface BookingRequirements {
  deposit?: boolean;
  depositAmount?: number;
  identification?: boolean;
  screening?: boolean;
  screeningType?: string;
  screeningDeadline?: string;
}

export interface Booking {
  id: string;
  escortId: string;
  clientId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: BookingLocation;
  services: BookingService[];
  extras?: BookingExtras[];
  totalAmount: number;
  deposit?: DepositPayment;
  payment: PaymentDetails;
  requirements: BookingRequirements;
  notes?: string;
  specialRequests?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRequest {
  escortId: string;
  date: string;
  startTime: string;
  duration: number;
  location: {
    type: 'incall' | 'outcall';
    address?: string;
    city: string;
  };
  services: string[]; // Service IDs
  extras?: string[]; // Extra IDs
  notes?: string;
  specialRequests?: string;
}

export interface BookingFilter {
  status?: string;
  startDate?: string;
  endDate?: string;
  escortId?: string;
  clientId?: string;
}

export interface BookingStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  popularServices: Array<{
    serviceId: string;
    serviceName: string;
    bookingCount: number;
  }>;
  popularTimes: Array<{
    dayOfWeek: number;
    hour: number;
    bookingCount: number;
  }>;
}