import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, Index } from 'typeorm';
import { IsString, IsInt, IsNumber, Min, Max, IsArray, IsOptional, IsEnum } from 'class-validator';
import { User } from './User';
import { Booking } from './Booking';

export enum ProfileStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  @IsString()
  displayName: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  bio: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  location: {
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };

  @Column({ type: 'jsonb', default: [] })
  @IsArray()
  images: {
    id: string;
    url: string;
    type: 'profile' | 'gallery';
    isPrivate: boolean;
    order: number;
  }[];

  @Column({ type: 'jsonb', default: {} })
  availability: {
    schedule: {
      [key: string]: { // day of week (0-6)
        enabled: boolean;
        slots: {
          start: string; // HH:mm
          end: string;
        }[];
      };
    };
    specialDates: {
      date: string; // YYYY-MM-DD
      available: boolean;
      slots?: {
        start: string;
        end: string;
      }[];
    }[];
    vacation: {
      start: string; // YYYY-MM-DD
      end: string;
    }[];
  };

  @Column({ type: 'jsonb', default: {} })
  services: {
    [key: string]: {
      name: string;
      description?: string;
      duration: number; // minutes
      price: number;
      enabled: boolean;
    };
  };

  @Column({ type: 'jsonb', default: {} })
  stats: {
    views: number;
    bookings: number;
    rating: number;
    ratingCount: number;
    responseRate: number;
    responseTime: number; // minutes
  };

  @Column({ type: 'enum', enum: ProfileStatus, default: ProfileStatus.PENDING })
  @IsEnum(ProfileStatus)
  status: ProfileStatus;

  @Column({ type: 'jsonb', default: {} })
  @IsOptional()
  preferences: {
    contactMethods: {
      email: boolean;
      phone: boolean;
      whatsapp: boolean;
    };
    notifications: {
      bookings: boolean;
      messages: boolean;
      reviews: boolean;
      promotions: boolean;
    };
    privacy: {
      showOnlineStatus: boolean;
      showLastSeen: boolean;
      showProfileViews: boolean;
    };
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Booking, booking => booking.profile)
  bookings: Booking[];
}