import { RoleId } from '../../dto/entities/auth/role.dto';
import { AuthenticatedUser } from '../../dto/entities';

// Roles that may see *every* account: the global admins (Super, General,
// Asistente General) and the expenses/Gastos domain, which manages suppliers,
// own accounts and clients alike. Everyone else — notably Ventas (5) and
// Asistente Ventas (7) — is scoped to client accounts only.
const BROAD_ACCOUNT_ROLE_IDS: number[] = [
    RoleId.SUPER,
    RoleId.ADMIN,
    RoleId.GUEST,
    RoleId.EXPENSES,
    RoleId.EXPENSES_ASSISTANT,
];

// Server-side account visibility check. Returns true when the user must be
// restricted to `is_client = true` accounts. This is enforced in the account
// read queries themselves (not via a role guard) so the restriction holds no
// matter what filter the client sends — a Ventas user cannot reach a supplier
// or own account by hand-crafting query arguments.
export function isAccountClientRestricted(user: AuthenticatedUser): boolean {
    return !user.role_ids.some((roleId) =>
        BROAD_ACCOUNT_ROLE_IDS.includes(roleId),
    );
}
