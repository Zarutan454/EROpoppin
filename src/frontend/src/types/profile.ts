export interface ProfileImage {
  id: string;
  url: string;
  thumbnail: string;
  isMain: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  isAvailable: boolean;
}

export interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Location {
  id: string;
  city: string;
  country: string;
  travelDistance?: number;
  inCall: boolean;
  outCall: boolean;
}

export interface Rate {
  id: string;
  duration: number;
  price: number;
  description?: string;
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

export interface PhysicalAttributes {
  height?: number;
  weight?: number;
  measurements?: string;
  eyeColor?: string;
  hairColor?: string;
  build?: string;
}

export interface Languages {
  language: string;
  level: 'basic' | 'intermediate' | 'fluent' | 'native';
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