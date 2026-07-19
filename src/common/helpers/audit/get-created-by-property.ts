/**
 * Stamps who created a row, from the logged-in user. Mirrors
 * getCreatedAtProperty — spread it into the prisma `create` branch only.
 *
 * Returns an empty object when there is no user in context (e.g. the seeder),
 * so the nullable column is simply left alone rather than written as null.
 */
export function getCreatedByProperty(current_user_id?: number | null) {
    return current_user_id ? { created_by_id: current_user_id } : {};
}
