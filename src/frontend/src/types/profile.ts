export interface PhysicalAttributes {
  height?: number;
  weight?: number;
  measurements?: string;
  eyeColor?: string;
  hairColor?: string;
  build?: string;
}

export interface Location {
  city: string;
  country: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Languages {
  language: string;
  level: 'basic' | 'intermediate' | 'fluent' | 'native';
}

export interface Rates {
  hourly: number;
  twoHours?: number;
  overnight?: number;
  weekend?: number;
}

export interface WorkingHours {
  start: string; // "HH:mm" format
  end: string;
  daysOff: number[]; // 0 = Sunday, 6 = Saturday
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
}

export interface ProfileImage {
  id: string;
  url: string;
  isVerified: boolean;
  isPrimary: boolean;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
}

export interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Rate {
  duration: string;
  price: number;
  description?: string;
}

export interface EscortProfile {
  id: string;
  userId: string;
  name: string;
  tagline?: string;
  description: string;
  age: number;
  gender: string;
  orientation: string;
  ethnicity?: string;
  nationality?: string;
  languages: Languages[];
  physicalAttributes: PhysicalAttributes;
  images: ProfileImage[];
  services: Service[];
  availability: Availability[];
  locations: Location[];
  rates: Rate[];
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  isVip: boolean;
  viewCount: number;
  favoriteCount: number;
  contactCount: number;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
}

export interface ProfileUpdateDto {
  name?: string;
  tagline?: string;
  description?: string;
  age?: number;
  gender?: string;
  orientation?: string;
  ethnicity?: string;
  nationality?: string;
  languages?: Languages[];
  physicalAttributes?: PhysicalAttributes;
  services?: Service[];
  availability?: Availability[];
  locations?: Location[];
  rates?: Rate[];
  isActive?: boolean;
}