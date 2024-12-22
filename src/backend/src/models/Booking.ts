import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { User } from './User';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  escortId: string;

  @Column('uuid')
  @Index()
  clientId: string;

  @Column('timestamp with time zone')
  date: Date;

  @Column('time')
  startTime: string;

  @Column('integer')
  duration: number;

  @Column('enum', { enum: ['incall', 'outcall'] })
  locationType: 'incall' | 'outcall';

  @Column('jsonb', { nullable: true })
  location: {
    address?: string;
    city: string;
    instructions?: string;
  };

  @Column('simple-array')
  services: string[];

  @Column('text', { nullable: true })
  specialRequests: string;

  @Column('boolean', { default: false })
  deposit: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  depositAmount: number;

  @Column('boolean', { default: true })
  verificationRequired: boolean;

  @Column('enum', { enum: ['id', 'reference', 'employment', 'other'], nullable: true })
  verificationMethod: 'id' | 'reference' | 'employment' | 'other';

  @Column('boolean', { default: false })
  agreesToTerms: boolean;

  @Column('enum', { enum: ['pending', 'confirmed', 'rejected', 'cancelled'] })
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';

  @Column('jsonb')
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

  @Column('jsonb', { nullable: true })
  escortResponse: {
    status: 'accepted' | 'rejected';
    message?: string;
    alternativeTime?: string;
  };

  @Column('jsonb', { nullable: true })
  verificationStatus: {
    verified: boolean;
    method: string;
    verifiedAt?: string;
  };

  @Column('jsonb', { nullable: true })
  chat: {
    enabled: boolean;
    channelId?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  escort: User;

  @ManyToOne(() => User)
  client: User;
}