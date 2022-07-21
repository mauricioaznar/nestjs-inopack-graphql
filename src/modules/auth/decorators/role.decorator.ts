import { SetMetadata } from '@nestjs/common';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';

export const ROLES_KEY = 'roles';
export const RolesDecorator = (...roles: RoleId[]) =>
    SetMetadata(ROLES_KEY, roles);
