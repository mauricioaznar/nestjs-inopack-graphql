import { MigrationInterface, QueryRunner } from 'typeorm';

// feature/inventory-drilldown-residuals — piece 3.
//
// New accounts flag `exclude_from_balances_summary`. When set, the account is
// removed from the "Cuentas propias" list on the Saldos y Pagos + Transfers pages
// AND does not feed the "Acumulado" running balance — only bank accounts do,
// because cash/notes are not reliably tracked. This is applied at the single
// source both views derive from (`getOwnAccountsTransferSummary`), so hiding the
// row and dropping it from the Acumulado seed happen together.
//
// Independent of `is_informal_account`: that flag governs the accountability /
// contabilidad export; this one governs the balances summaries. The two house
// accounts differ on the export axis — Efectivo is formal (stays in the export),
// Notas is informal (excluded from it) — but both are excluded from balances here.
//
// Seeded on Inopack Notas (id 38) and Inopack Efectivo (id 400).
//
// TEST-DB SAFETY: the seed UPDATE matches 0 rows on the empty snapshot; the ALTER
// is pure DDL with a default. No INSERT with a hardcoded id, no NOT NULL column
// without a default — mirrors the established 1789300000000-RenameInformalFlags
// reseed pattern.
export class AddExcludeFromBalancesSummaryToAccounts1789500000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`accounts\`
        ADD COLUMN \`exclude_from_balances_summary\` tinyint(1) NOT NULL DEFAULT '0';
    `);
        // Inopack Notas (38) + Inopack Efectivo (400). No-op on the empty test DB.
        await queryRunner.query(`
      UPDATE \`accounts\` SET \`exclude_from_balances_summary\` = 1 WHERE \`id\` IN (38, 400);
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`accounts\` DROP COLUMN \`exclude_from_balances_summary\`;
    `);
    }
}
