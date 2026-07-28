import { MigrationInterface, QueryRunner } from 'typeorm';

// Turns on `accounts.supplier_require_supplement` for the supplier accounts whose
// recent history shows they issue a complemento de pago. The flag only pre-checks
// `require_supplement` when that supplier is picked on a NEW expense; it changes
// no existing document and the capture form can still be unchecked per expense.
//
// EVIDENCE (read-only review run 2026-07-27 against the accounting-eligible
// expenses of 2026-01-01..2026-05-31 — the five calendar months before the
// selected month and the one preceding it, which is still settling):
//   * only documents that reach the accountant count (active, non-canceled,
//     receipt type "Factura", supplier account, not Inopack notas, not paid
//     through it, reconciliation-only excluded so a duplicated document does not
//     weight its supplier twice);
//   * an account qualifies when at least one eligible expense was explicitly
//     marked `require_supplement` or carried a captured `supplement_code`.
//
// The list is deliberately NOT recomputed here. A migration that re-derives its
// own targets would apply a different set on every database it runs against;
// this one applies exactly what a human reviewed.
//
// ENABLE-ONLY, by design. A supplier that shows no complemento in five months has
// not been proven to stop issuing them — the field has never been captured
// consistently, so absence of evidence is not evidence of absence. Disabling
// stays a manual decision on the account form.
//
// MATCHES BY ID ONLY, and never fails the deploy. Accounts that no longer exist,
// went inactive, or stopped being suppliers are skipped and named in the log; a
// name that drifted from the review is reported and applied anyway. The one thing
// that still throws is an UPDATE that silently did not take effect.
//
// Reconciliation query to eyeball the result after running:
//   SELECT id, name, supplier_require_supplement FROM accounts
//   WHERE is_supplier = 1 AND supplier_require_supplement = 1 ORDER BY name;

type TargetAccount = {
    id: number;
    // Recorded for traceability and reported when it differs — never enforced.
    // Matching is by id alone (user decision 2026-07-27): ids are stable
    // autoincrement keys, and names carry legacy encoding damage that would make
    // an exact comparison fail for the wrong reason.
    name: string;
    evidence: 'ALTA' | 'MEDIA';
};

// `name` values are what the reviewed database stored at review time. Account 74
// really does contain two '?' characters — a legacy import lost the 'ñ'. Left as
// found so the log line matches what an operator sees in the database.
const TARGET_ACCOUNTS: TargetAccount[] = [
    // ALTA — high volume, complemento captured on nearly every eligible expense.
    { id: 61, name: 'Distribuidora el tigre del sureste', evidence: 'ALTA' },
    { id: 157, name: 'Jesus Maria Pacheco Montejo', evidence: 'ALTA' },
    { id: 46, name: 'Bodega Xaze', evidence: 'ALTA' },
    { id: 50, name: 'Alejandra Patraca Ortiz', evidence: 'ALTA' },
    { id: 63, name: 'Enerwater', evidence: 'ALTA' },
    { id: 82, name: 'Brenda Elizabeth Vazquez', evidence: 'ALTA' },
    { id: 143, name: 'Comercializadora y Servicios Geskal', evidence: 'ALTA' },
    { id: 111, name: 'Servicios Flexograficos de Mexico', evidence: 'ALTA' },
    { id: 49, name: 'Metalnet', evidence: 'ALTA' },
    // MEDIA — fewer confirmations, but every one of them is an explicit human
    // decision and most carry a real complemento code. The low ratios come from
    // OTHER expenses of the same supplier never being captured, not from
    // evidence pointing the other way.
    { id: 286, name: 'Omar Flores Reyes', evidence: 'MEDIA' },
    { id: 357, name: 'Polimerida', evidence: 'MEDIA' },
    { id: 57, name: 'Consultores Corporativos Emlex', evidence: 'MEDIA' },
    { id: 4, name: 'Proveedora del Panadero', evidence: 'MEDIA' },
    { id: 178, name: 'Silver Tech De Mexico', evidence: 'MEDIA' },
    { id: 242, name: 'Ariel Arturo Castillo Bagundo', evidence: 'MEDIA' },
    { id: 206, name: 'Distribuidora Don Ramis', evidence: 'MEDIA' },
    { id: 74, name: 'Jesus ya??ez mena', evidence: 'MEDIA' },
    { id: 151, name: 'Delia del Carmen Tenorio Vazquez', evidence: 'MEDIA' },
    { id: 104, name: 'Pahusa Productos Industriales', evidence: 'MEDIA' },
    { id: 147, name: 'Plasticenter Maquinaria', evidence: 'MEDIA' },
    { id: 44, name: 'Geo transportes', evidence: 'MEDIA' },
    { id: 145, name: 'Llantas del Sureste MQ', evidence: 'MEDIA' },
    { id: 164, name: 'Rebolledos', evidence: 'MEDIA' },
    { id: 376, name: 'Rubi Beatriz Torres Soberanis', evidence: 'MEDIA' },
    { id: 359, name: 'William Herberto De Jesus Castro Cetina', evidence: 'MEDIA' },
];

// The standalone runner hands migrations mysql2's `connection.query`, which
// resolves to a `[rows, fields]` tuple rather than the rows themselves. Same
// helper as ReconcileDuplicateAccounts — reading `result[0]` blindly would treat
// the first ROW as the whole result set on a driver that returns rows directly.
function rowsFrom<T>(result: unknown): T[] {
    if (!Array.isArray(result)) return [];
    if (result.length === 2 && Array.isArray(result[0])) return result[0] as T[];
    return result as T[];
}

type AccountRow = {
    id: number;
    name: string;
    active: number;
    is_supplier: number;
    supplier_require_supplement: number;
};

export class EnableSupplierRequireSupplementDefaults1784851200000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        const ids = TARGET_ACCOUNTS.map((account) => account.id);
        const placeholders = ids.map(() => '?').join(', ');

        const rows = rowsFrom<AccountRow>(
            await queryRunner.query(
                'SELECT `id`, `name`, `active`, `is_supplier`, `supplier_require_supplement` ' +
                    `FROM \`accounts\` WHERE \`id\` IN (${placeholders})`,
                ids,
            ),
        );

        const byId = new Map(rows.map((row) => [Number(row.id), row]));

        // Preflight REPORTS, it does not block. Turning a default on for the
        // wrong supplier costs one unchecked box on the next expense, which is
        // not worth failing a deploy over — and a supplier that was retired or
        // renamed since the review is a normal production state, not a reason to
        // withhold the other 24 accounts. Everything skipped is named in the log.
        const notes: string[] = [];
        const skipped: string[] = [];
        const toEnable: number[] = [];
        let alreadyOn = 0;

        for (const target of TARGET_ACCOUNTS) {
            const row = byId.get(target.id);
            if (!row) {
                skipped.push(`#${target.id} (${target.name}): no existe`);
                continue;
            }
            if (row.name !== target.name) {
                // Informational: ids are what identify the account here.
                notes.push(
                    `#${target.id}: nombre distinto al revisado ("${target.name}" -> "${row.name}")`,
                );
            }
            if (Number(row.active) !== 1) {
                skipped.push(`#${target.id} (${row.name}): cuenta inactiva`);
                continue;
            }
            if (!row.is_supplier) {
                skipped.push(
                    `#${target.id} (${row.name}): no es cuenta de proveedor`,
                );
                continue;
            }
            // Re-running is a no-op, and an account somebody already enabled by
            // hand is left alone.
            if (row.supplier_require_supplement) {
                alreadyOn += 1;
                continue;
            }
            toEnable.push(target.id);
        }

        notes.forEach((note) => console.log(`  aviso: ${note}`));
        skipped.forEach((note) => console.log(`  omitida: ${note}`));

        if (toEnable.length > 0) {
            await queryRunner.query(
                'UPDATE `accounts` SET `supplier_require_supplement` = 1, `updated_at` = NOW() ' +
                    `WHERE \`id\` IN (${toEnable.map(() => '?').join(', ')}) ` +
                    'AND `supplier_require_supplement` = 0',
                toEnable,
            );

            // Post-assert over what we actually tried to change.
            const after = rowsFrom<{
                id: number;
                supplier_require_supplement: number;
            }>(
                await queryRunner.query(
                    'SELECT `id`, `supplier_require_supplement` FROM `accounts` ' +
                        `WHERE \`id\` IN (${toEnable.map(() => '?').join(', ')})`,
                    toEnable,
                ),
            );
            const stillOff = after.filter(
                (row) => !row.supplier_require_supplement,
            );
            if (stillOff.length > 0) {
                throw new Error(
                    'EnableSupplierRequireSupplementDefaults: el UPDATE no surtio efecto en: ' +
                        stillOff.map((row) => `#${row.id}`).join(', '),
                );
            }
        }

        console.log(
            `EnableSupplierRequireSupplementDefaults: ${toEnable.length} activada(s), ` +
                `${alreadyOn} ya lo estaban, ${skipped.length} omitida(s).`,
        );
    }

    // Intentionally a no-op. Reverting would have to turn the flag off, and this
    // migration cannot tell an account it enabled from one that was already
    // enabled before it ran — and disabling on incomplete evidence is exactly
    // what the review rules forbid. Undo by hand on the account form.
    public async down(): Promise<void> {
        return;
    }
}
