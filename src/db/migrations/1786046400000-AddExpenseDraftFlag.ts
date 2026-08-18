import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the expense draft workflow and removes the obsolete expense-status
 * feature.
 *
 * Monitored suppliers default new expenses to draft. Their existing expenses
 * remain finalized when an active transfer receipt already exists; only the
 * few still-untransferred expenses are backfilled as drafts.
 */
export class AddExpenseDraftFlag1786046400000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`accounts\`
                ADD COLUMN \`supplier_is_draft\` tinyint(1) NOT NULL DEFAULT 0
                AFTER \`supplier_reconciliation_only\`;
        `);
        await queryRunner.query(`
            UPDATE \`accounts\`
            SET \`supplier_is_draft\` = 1
            WHERE \`monitor_supplier_expenses\` = 1;
        `);
        await queryRunner.query(`
            ALTER TABLE \`expenses\`
                ADD COLUMN \`is_draft\` tinyint(1) NOT NULL DEFAULT 0
                AFTER \`reconciliation_only\`;
        `);
        await queryRunner.query(`
            UPDATE \`expenses\` e
            JOIN \`accounts\` a ON a.id = e.account_id
            SET e.\`is_draft\` = 1
            WHERE a.\`monitor_supplier_expenses\` = 1
              AND NOT EXISTS (
                  SELECT 1
                  FROM \`transfer_receipts\` tr
                  JOIN \`transfers\` t ON t.id = tr.transfer_id
                  WHERE tr.expense_id = e.id
                    AND tr.active = 1
                    AND t.active = 1
              );
        `);

        await queryRunner.query(`
            ALTER TABLE \`expenses\`
                DROP FOREIGN KEY \`expenses_expense_status_id_foreign\`;
        `);
        await queryRunner.query(`
            ALTER TABLE \`expenses\` DROP COLUMN \`expense_status_id\`;
        `);
        await queryRunner.query(
            `DROP TABLE IF EXISTS \`expense_statuses\`;`,
        );
    }

    // Expense status data cannot be reconstructed reliably, so this feature
    // migration remains intentionally one-way.
    public async down(_queryRunner: QueryRunner): Promise<void> {}
}
