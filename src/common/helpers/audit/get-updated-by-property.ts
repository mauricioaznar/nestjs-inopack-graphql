/**
 * Stamps who last touched a row, from the logged-in user. Mirrors
 * getUpdatedAtProperty — spread it into BOTH prisma branches of an upsert, and
 * into soft-delete updates (so "who deleted it" is answerable without the
 * activity log).
 *
 * Returns an empty object when there is no user in context, so an existing
 * stamp is never overwritten with null.
 */
export function getUpdatedByProperty(current_user_id?: number | null) {
    return current_user_id ? { updated_by_id: current_user_id } : {};
}
