import { RoleId } from '../../common/dto/entities/auth/role.dto';

/**
 * The one role-satisfaction rule shared by every gate in the app.
 *
 * `GqlRolesGuard` calls it to admit an operation; the `activity` subscription's
 * per-event filter (`canSeeActivity`) calls it to decide which notifications a
 * socket receives. Both need the identical global-role semantics, so they live
 * here once instead of being copied — a change to how General or Asistente
 * General are treated can no longer land in the guard and silently skip the
 * live feed.
 *
 * The rule:
 * - **Super** does everything, super-only areas included.
 * - **Asistente General** (GUEST) is global read-only: it passes any non-super
 *   gate on a non-mutation operation, and can never mutate.
 * - **General** (ADMIN) is a global admin: it passes every non-super gate.
 * - Everyone else must hold one of the exact roles the gate lists.
 *
 * A gate that lists SUPER is satisfied by Super alone (handled first); General
 * does not inherit a super-only gate. `isMutation` is what makes Asistente
 * General read-only — the caller decides it (a GraphQL mutation for the guard,
 * always false for an activity notification).
 */
export function roleSatisfiesGate(
    userRoleIds: number[],
    requiredRoles: RoleId[],
    isMutation: boolean,
): boolean {
    if (userRoleIds.includes(RoleId.SUPER)) {
        return true;
    }

    const requiresSuper = requiredRoles.includes(RoleId.SUPER);

    // Asistente General: global read-only on any non-super gate.
    if (userRoleIds.includes(RoleId.GUEST) && !isMutation && !requiresSuper) {
        return true;
    }

    // General: global admin over every non-super gate.
    const isGeneralAdmin = userRoleIds.includes(RoleId.ADMIN);

    return requiredRoles.some((role) => {
        // A super-only gate is satisfied by Super alone, handled above.
        if (role === RoleId.SUPER) {
            return false;
        }
        return isGeneralAdmin || userRoleIds.includes(role);
    });
}
