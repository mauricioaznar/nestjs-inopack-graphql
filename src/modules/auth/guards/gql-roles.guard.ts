import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserWithRoles } from '../../../common/dto/entities';

@Injectable()
export class GqlRolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(ctx: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<RoleId[]>(
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

        // Super can do everything, including super-only areas (e.g. Users).
        if (userRoleIds.includes(RoleId.SUPER)) {
            return true;
        }

        // Asistente General (role 3) is a global read-only role: it may run any
        // non-mutation operation (queries + subscriptions) on any non-super gate,
        // but can never mutate.
        if (userRoleIds.includes(RoleId.GUEST)) {
            const operation = context.getInfo()?.operation?.operation;
            if (
                operation !== 'mutation' &&
                !requiredRoles.includes(RoleId.SUPER)
            ) {
                return true;
            }
        }

        // General (formerly "Admin", role 2) is a global admin: it passes every
        // domain gate — but NOT a super-only gate.
        const isGeneralAdmin = userRoleIds.includes(RoleId.ADMIN);

        return requiredRoles.some((role) => {
            // A super-only gate is satisfied by super alone (handled above).
            if (role === RoleId.SUPER) {
                return false;
            }
            // General passes any non-super gate; everyone else must hold one of
            // the exact roles the resolver asks for. To give an "assistant" role
            // write-but-not-delete, list it on the upsert gate and omit it on the
            // delete gate.
            return isGeneralAdmin || userRoleIds.includes(role);
        });
    }
}
