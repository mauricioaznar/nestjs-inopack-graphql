import { SetMetadata } from '@nestjs/common';
import { RoleTypes } from '../../../common/dto/entities/auth/role.dto';

export const ROLES_KEY = 'roles';
export const Role = (...roles: RoleTypes[]) => SetMetadata(ROLES_KEY, roles);
