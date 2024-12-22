import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { CurrentUser } from '../decorators/CurrentUser';
import { ReviewService } from '../services/ReviewService';
import {
  ReviewRequest,
  ReviewResponseRequest,
  ReviewFilter,
} from '@shared/types/review';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('photos', 5))
  @ApiOperation({ summary: 'Create a new review' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() data: ReviewRequest,
    @UploadedFiles() photos: Express.Multer.File[],
  ) {
    return this.reviewService.create(userId, {
      ...data,
      photos,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get reviews by filter' })
  async findAll(
    @Query('escortId') escortId: string,
    @Query('clientId') clientId?: string,
    @Query('bookingId') bookingId?: string,
    @Query('minRating', new ParseIntPipe({ optional: true }))
    minRating?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('isVerified') isVerified?: boolean,
    @Query('isPublic') isPublic?: boolean,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    const filter: ReviewFilter = {
      escortId,
      clientId,
      bookingId,
      minRating,
      startDate,
      endDate,
      isVerified,
      isPublic,
    };

    return this.reviewService.findAll(filter, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  async findOne(@Param('id') id: string) {
    return this.reviewService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('photos', 5))
  @ApiOperation({ summary: 'Update a review' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() data: Partial<ReviewRequest>,
    @UploadedFiles() photos: Express.Multer.File[],
  ) {
    return this.reviewService.update(userId, id, {
      ...data,
      photos,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.reviewService.delete(userId, id);
  }

  @Post(':id/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Respond to a review' })
  async respond(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ValidationPipe()) data: ReviewResponseRequest,
  ) {
    return this.reviewService.respond(userId, id, data);
  }
}