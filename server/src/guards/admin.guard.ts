import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin, AdminPermission } from '../models/Admin';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const admin = await this.adminRepository.findOne({
        where: { id: payload.sub }
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Invalid or inactive admin account');
      }

      // Check required permissions
      const requiredPermission = this.reflector.get<AdminPermission>(
        'permission',
        context.getHandler()
      );

      if (requiredPermission && !admin.permissions.includes(requiredPermission)) {
        throw new UnauthorizedException('Insufficient permissions');
      }

      // Attach admin to request
      request.admin = admin;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}