export interface BookingRequest {
  escortId: string;
  clientId: string;
  date: string;
  startTime: string;
  duration: number; // in hours
  locationType: 'incall' | 'outcall';
  location?: {
    address?: string;
    city: string;
    instructions?: string;
  };
  services: string[];
  specialRequests?: string;
  deposit: boolean;
  depositAmount?: number;
  verificationRequired: boolean;
  verificationMethod?: 'id' | 'reference' | 'employment' | 'other';
  agreesToTerms: boolean;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  payment: {
    method: 'cash' | 'crypto' | 'bank_transfer';
    total: number;
    currency: string;
    deposit?: {
      amount: number;
      paid: boolean;
      transactionId?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface BookingResponse {
  id: string;
  booking: BookingRequest;
  escortResponse?: {
    status: 'accepted' | 'rejected';
    message?: string;
    alternativeTime?: string;
  };
  verificationStatus?: {
    verified: boolean;
    method: string;
    verifiedAt?: string;
  };
  chat?: {
    enabled: boolean;
    channelId?: string;
  };
}