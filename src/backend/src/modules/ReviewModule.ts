import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewController } from '../controllers/ReviewController';
import { ReviewService } from '../services/ReviewService';
import { ReviewRepository } from '../repositories/ReviewRepository';
import { BookingModule } from './BookingModule';
import { StorageModule } from './StorageModule';
import { Review } from '../models/Review';
import { ReviewResponse } from '../models/ReviewResponse';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, ReviewResponse]),
    BookingModule,
    StorageModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepository],
  exports: [ReviewService],
})
export class ReviewModule {}