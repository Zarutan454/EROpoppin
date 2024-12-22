import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { Booking } from './Booking';
import { ReviewResponse } from './ReviewResponse';

@Entity('reviews')
@Index(['escortId', 'createdAt'])
@Index(['clientId', 'createdAt'])
@Index(['bookingId'], { unique: true })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  escortId: string;

  @Column('uuid')
  @Index()
  clientId: string;

  @Column('uuid')
  bookingId: string;

  @Column('jsonb')
  rating: {
    overall: number;
    communication: number;
    appearance: number;
    service: number;
    location: number;
    value: number;
  };

  @Column('text')
  content: string;

  @Column('text', { array: true, nullable: true })
  photos?: string[];

  @Column('boolean', { default: true })
  isPublic: boolean;

  @Column('boolean', { default: false })
  isAnonymous: boolean;

  @Column('boolean', { default: false })
  isVerified: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'escortId' })
  escort: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @OneToOne(() => ReviewResponse, response => response.review, {
    nullable: true,
    cascade: true,
  })
  response: ReviewResponse;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}