import { Module, CacheModule } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Review } from './models/Review';
import { ReviewResponse } from './models/ReviewResponse';
import { User } from './models/User';
import { EscortProfile } from './models/EscortProfile';
import { ReviewService } from './services/review.service';
import { ReviewController } from './controllers/review.controller';
import { NotificationService } from './services/notification.service';
import { ImageService } from './services/image.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [Review, ReviewResponse, User, EscortProfile],
        synchronize: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Review, ReviewResponse, User, EscortProfile]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        ttl: 60 * 60 * 24, // 24 Stunden Standard-TTL
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    NotificationService,
    ImageService,
    ConfigService,
  ],
})
export class AppModule {}