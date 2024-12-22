import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { Admin, AdminRole, AdminPermission } from '../models/Admin';
import { AdminGuard } from '../guards/admin.guard';
import { HasPermission } from '../decorators/has-permission.decorator';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // User Management
  @Get('users')
  @HasPermission(AdminPermission.MANAGE_USERS)
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    return this.adminService.getAllUsers({ page, limit, search, status });
  }

  @Get('users/:id')
  @HasPermission(AdminPermission.MANAGE_USERS)
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Put('users/:id')
  @HasPermission(AdminPermission.MANAGE_USERS)
  @ApiOperation({ summary: 'Update user' })
  async updateUser(
    @Param('id') id: string,
    @Body() userData: any
  ) {
    return this.adminService.updateUser(id, userData);
  }

  @Delete('users/:id')
  @HasPermission(AdminPermission.MANAGE_USERS)
  @ApiOperation({ summary: 'Delete user' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // Booking Management
  @Get('bookings')
  @HasPermission(AdminPermission.MANAGE_BOOKINGS)
  @ApiOperation({ summary: 'Get all bookings' })
  async getAllBookings(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.adminService.getAllBookings({ page, limit, status, startDate, endDate });
  }

  @Get('bookings/:id')
  @HasPermission(AdminPermission.MANAGE_BOOKINGS)
  @ApiOperation({ summary: 'Get booking by ID' })
  async getBooking(@Param('id') id: string) {
    return this.adminService.getBooking(id);
  }

  @Put('bookings/:id')
  @HasPermission(AdminPermission.MANAGE_BOOKINGS)
  @ApiOperation({ summary: 'Update booking' })
  async updateBooking(
    @Param('id') id: string,
    @Body() bookingData: any
  ) {
    return this.adminService.updateBooking(id, bookingData);
  }

  // Content Moderation
  @Get('content/moderation')
  @HasPermission(AdminPermission.MODERATE_CONTENT)
  @ApiOperation({ summary: 'Get content for moderation' })
  async getContentForModeration(
    @Query('type') type?: string,
    @Query('status') status?: string
  ) {
    return this.adminService.getContentForModeration({ type, status });
  }

  @Put('content/:id/moderate')
  @HasPermission(AdminPermission.MODERATE_CONTENT)
  @ApiOperation({ summary: 'Moderate content' })
  async moderateContent(
    @Param('id') id: string,
    @Body() moderationData: {
      action: 'approve' | 'reject' | 'flag';
      reason?: string;
    }
  ) {
    return this.adminService.moderateContent(id, moderationData);
  }

  // Statistics & Analytics
  @Get('statistics')
  @HasPermission(AdminPermission.VIEW_STATISTICS)
  @ApiOperation({ summary: 'Get system statistics' })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string
  ) {
    return this.adminService.getStatistics({ startDate, endDate, type });
  }

  // System Settings
  @Get('settings')
  @HasPermission(AdminPermission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Get system settings' })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  @HasPermission(AdminPermission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Update system settings' })
  async updateSettings(@Body() settings: any) {
    return this.adminService.updateSettings(settings);
  }

  // Admin Management
  @Get('admins')
  @HasPermission(AdminPermission.MANAGE_USERS)
  @ApiOperation({ summary: 'Get all admins' })
  async getAllAdmins() {
    return this.adminService.getAllAdmins();
  }

  @Post('admins')
  @HasPermission(AdminPermission.MANAGE_USERS)
  @ApiOperation({ summary: 'Create new admin' })
  async createAdmin(@Body() adminData: Partial<Admin>) {
    return this.adminService.createAdmin(adminData);
  }

  @Put('admins/:id')
  @HasPermission(AdminPermission.MANAGE_USERS)
  @ApiOperation({ summary: 'Update admin' })
  async updateAdmin(
    @Param('id') id: string,
    @Body() adminData: Partial<Admin>
  ) {
    return this.adminService.updateAdmin(id, adminData);
  }

  @Delete('admins/:id')
  @HasPermission(AdminPermission.MANAGE_USERS)
  @ApiOperation({ summary: 'Delete admin' })
  async deleteAdmin(@Param('id') id: string) {
    return this.adminService.deleteAdmin(id);
  }

  // Activity Logs
  @Get('logs')
  @HasPermission(AdminPermission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Get activity logs' })
  async getActivityLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.adminService.getActivityLogs({ page, limit, type, startDate, endDate });
  }

  // Support Tickets
  @Get('support/tickets')
  @HasPermission(AdminPermission.SUPPORT_TICKETS)
  @ApiOperation({ summary: 'Get support tickets' })
  async getSupportTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string
  ) {
    return this.adminService.getSupportTickets({ status, priority });
  }

  @Put('support/tickets/:id')
  @HasPermission(AdminPermission.SUPPORT_TICKETS)
  @ApiOperation({ summary: 'Update support ticket' })
  async updateSupportTicket(
    @Param('id') id: string,
    @Body() ticketData: any
  ) {
    return this.adminService.updateSupportTicket(id, ticketData);
  }
}