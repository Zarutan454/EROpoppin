import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Profile, ProfileStatus } from '../models/Profile';
import { ProfileService } from '../services/profile.service';
import { ImageService } from '../services/image.service';
import { ValidateObjectId } from '../pipes/validate-object-id.pipe';
import { multerConfig } from '../config/multer.config';

@ApiTags('profiles')
@Controller('profiles')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly imageService: ImageService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all profiles' })
  @ApiResponse({ status: 200, description: 'Returns all profiles' })
  async getAllProfiles(
    @Query('status') status?: ProfileStatus,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.profileService.findAll({ status, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get profile by ID' })
  @ApiResponse({ status: 200, description: 'Returns the profile' })
  async getProfile(@Param('id', ValidateObjectId) id: string) {
    return this.profileService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new profile' })
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  async createProfile(
    @Request() req,
    @Body() profileData: Partial<Profile>
  ) {
    return this.profileService.create({
      ...profileData,
      userId: req.user.id
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @Param('id', ValidateObjectId) id: string,
    @Request() req,
    @Body() profileData: Partial<Profile>
  ) {
    return this.profileService.update(id, req.user.id, profileData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete profile' })
  @ApiResponse({ status: 200, description: 'Profile deleted successfully' })
  async deleteProfile(
    @Param('id', ValidateObjectId) id: string,
    @Request() req
  ) {
    return this.profileService.delete(id, req.user.id);
  }

  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('images', 10, multerConfig))
  @ApiOperation({ summary: 'Upload profile images' })
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  async uploadImages(
    @Param('id', ValidateObjectId) id: string,
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('type') type: 'profile' | 'gallery' = 'gallery',
    @Body('isPrivate') isPrivate: boolean = false
  ) {
    const uploadedImages = await Promise.all(
      files.map(file => this.imageService.upload(file))
    );

    return this.profileService.addImages(id, req.user.id, uploadedImages.map((url, index) => ({
      url,
      type,
      isPrivate,
      order: index
    })));
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete profile image' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  async deleteImage(
    @Param('id', ValidateObjectId) id: string,
    @Param('imageId') imageId: string,
    @Request() req
  ) {
    return this.profileService.deleteImage(id, req.user.id, imageId);
  }

  @Put(':id/images/reorder')
  @ApiOperation({ summary: 'Reorder profile images' })
  @ApiResponse({ status: 200, description: 'Images reordered successfully' })
  async reorderImages(
    @Param('id', ValidateObjectId) id: string,
    @Request() req,
    @Body() orderData: { imageId: string; order: number }[]
  ) {
    return this.profileService.reorderImages(id, req.user.id, orderData);
  }

  @Put(':id/availability')
  @ApiOperation({ summary: 'Update availability settings' })
  @ApiResponse({ status: 200, description: 'Availability updated successfully' })
  async updateAvailability(
    @Param('id', ValidateObjectId) id: string,
    @Request() req,
    @Body() availabilityData: Profile['availability']
  ) {
    return this.profileService.updateAvailability(id, req.user.id, availabilityData);
  }

  @Put(':id/services')
  @ApiOperation({ summary: 'Update service offerings' })
  @ApiResponse({ status: 200, description: 'Services updated successfully' })
  async updateServices(
    @Param('id', ValidateObjectId) id: string,
    @Request() req,
    @Body() servicesData: Profile['services']
  ) {
    return this.profileService.updateServices(id, req.user.id, servicesData);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get profile statistics' })
  @ApiResponse({ status: 200, description: 'Returns profile statistics' })
  async getStats(
    @Param('id', ValidateObjectId) id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.profileService.getStats(id, { startDate, endDate });
  }

  @Put(':id/preferences')
  @ApiOperation({ summary: 'Update profile preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async updatePreferences(
    @Param('id', ValidateObjectId) id: string,
    @Request() req,
    @Body() preferencesData: Profile['preferences']
  ) {
    return this.profileService.updatePreferences(id, req.user.id, preferencesData);
  }
}