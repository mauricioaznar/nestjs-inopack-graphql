import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator';
import { RoleTypes } from '../../../common/dto/entities/auth/role.dto';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserWithRoles } from '../../../common/dto/entities';

@Injectable()
export class GqlRolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(ctx: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<RoleTypes[]>(
            ROLES_KEY,
            [ctx.getHandler(), ctx.getClass()],
        );
        if (!requiredRoles) {
            return true;
        }

        const context = GqlExecutionContext.create(ctx);
        const { req } = context.getContext();
        const user = req.user as UserWithRoles;
        const userRoleIds = user.user_roles.map((userRole) => userRole.role_id);
        return requiredRoles.some((role) => {
            switch (role) {
                case 'super':
                    return userRoleIds.includes(1);
                case 'admin':
                    return userRoleIds.includes(1) || userRoleIds.includes(2);
                case 'guest':
                    return (
                        userRoleIds.includes(3) ||
                        userRoleIds.includes(1) ||
                        userRoleIds.includes(2)
                    );
                case 'production':
                    return (
                        userRoleIds.includes(4) ||
                        userRoleIds.includes(1) ||
                        userRoleIds.includes(2)
                    );
                case 'sales':
                    return (
                        userRoleIds.includes(5) ||
                        userRoleIds.includes(1) ||
                        userRoleIds.includes(2)
                    );
                default:
                    return false;
            }
        });
    }
}
