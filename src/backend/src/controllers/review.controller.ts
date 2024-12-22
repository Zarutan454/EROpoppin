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
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { ReviewService } from '../services/review.service';
import { Review, ReviewRequest, ReviewStats } from '../types/review';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('photos', 5))
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  async createReview(
    @Request() req,
    @Body() reviewData: ReviewRequest,
    @UploadedFiles() photos: Express.Multer.File[],
  ) {
    return this.reviewService.createReview(req.user.id, {
      ...reviewData,
      photos,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiResponse({ status: 200, description: 'Review found' })
  async getReview(@Param('id') id: string) {
    return this.reviewService.getReview(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('photos', 5))
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  async updateReview(
    @Request() req,
    @Param('id') id: string,
    @Body() reviewData: Partial<ReviewRequest>,
    @UploadedFiles() photos: Express.Multer.File[],
  ) {
    return this.reviewService.updateReview(req.user.id, id, {
      ...reviewData,
      photos,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  async deleteReview(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.reviewService.deleteReview(req.user.id, id);
  }

  @Post(':id/respond')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('escort')
  @ApiOperation({ summary: 'Respond to a review' })
  @ApiResponse({ status: 201, description: 'Response added successfully' })
  async respondToReview(
    @Request() req,
    @Param('id') reviewId: string,
    @Body('content') content: string,
  ) {
    return this.reviewService.respondToReview(req.user.id, reviewId, content);
  }

  @Get('escort/:escortId')
  @ApiOperation({ summary: 'Get reviews for an escort' })
  @ApiResponse({ status: 200, description: 'Reviews found' })
  async getEscortReviews(
    @Param('escortId') escortId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('filter') filter?: 'all' | 'verified',
  ) {
    return this.reviewService.getEscortReviews(escortId, {
      page,
      limit,
      sortBy,
      order,
      filter,
    });
  }

  @Get('escort/:escortId/stats')
  @ApiOperation({ summary: 'Get review statistics for an escort' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getReviewStats(@Param('escortId') escortId: string): Promise<ReviewStats> {
    return this.reviewService.getReviewStats(escortId);
  }

  // Admin Routes
  @Get('moderation/pending')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: 'Get reviews pending moderation' })
  @ApiResponse({ status: 200, description: 'Pending reviews retrieved' })
  async getPendingReviews(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewService.getPendingReviews(page, limit);
  }

  @Put(':id/moderate')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: 'Moderate a review' })
  @ApiResponse({ status: 200, description: 'Review moderated successfully' })
  async moderateReview(
    @Param('id') id: string,
    @Body() moderationData: {
      action: 'approve' | 'reject';
      reason?: string;
    },
  ) {
    return this.reviewService.moderateReview(id, moderationData);
  }
}