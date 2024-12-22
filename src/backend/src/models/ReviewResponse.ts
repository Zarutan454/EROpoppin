import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Review } from './Review';

@Entity('review_responses')
export class ReviewResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index({ unique: true })
  reviewId: string;

  @Column('uuid')
  @Index()
  escortId: string;

  @Column('text')
  content: string;

  @OneToOne(() => Review, review => review.response)
  @JoinColumn({ name: 'reviewId' })
  review: Review;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}