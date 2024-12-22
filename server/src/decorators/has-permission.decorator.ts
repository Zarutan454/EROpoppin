import { SetMetadata } from '@nestjs/common';
import { AdminPermission } from '../models/Admin';

export const HasPermission = (permission: AdminPermission) => SetMetadata('permission', permission);