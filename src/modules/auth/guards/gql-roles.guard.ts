import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedUser } from '../../../common/dto/entities';
import { roleSatisfiesGate } from '../roles/role-access';

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
        const user = req.user as AuthenticatedUser;

        // The role rule itself lives in `roleSatisfiesGate`, shared with the
        // activity subscription's per-event filter so the two never drift. Super
        // does everything; Asistente General is global read-only (hence the
        // mutation check); General passes every non-super gate; everyone else
        // must hold one of the exact roles the resolver lists. To give an
        // "assistant" role write-but-not-delete, list it on the upsert gate and
        // omit it on the delete gate.
        const isMutation =
            context.getInfo()?.operation?.operation === 'mutation';

        return roleSatisfiesGate(user.role_ids, requiredRoles, isMutation);
    }
}
