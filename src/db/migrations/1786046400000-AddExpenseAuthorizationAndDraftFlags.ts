import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds payment-authorization and draft flags for supplier expenses, and removes
 * the obsolete expense-status feature.
 *
 * Existing monitored suppliers and their expenses require payment approval.
 * Draft defaults remain OFF for every account and historical expense. Expenses
 * created through the recurring-expense generator are marked as drafts by the
 * application service.
 */
export class AddExpenseAuthorizationAndDraftFlags1786046400000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`accounts\`
                ADD COLUMN \`supplier_payment_authorized_default\` tinyint(1) NOT NULL DEFAULT 1
                AFTER \`supplier_reconciliation_only\`;
        `);
        await queryRunner.query(`
            UPDATE \`accounts\`
            SET \`supplier_payment_authorized_default\` = 0
            WHERE \`monitor_supplier_expenses\` = 1;
        `);
        await queryRunner.query(`
            ALTER TABLE \`expenses\`
                ADD COLUMN \`payment_authorized\` tinyint(1) NOT NULL DEFAULT 1
                AFTER \`reconciliation_only\`;
        `);
        await queryRunner.query(`
            UPDATE \`expenses\` e
            JOIN \`accounts\` a ON a.id = e.account_id
            SET e.\`payment_authorized\` = 0
            WHERE a.\`monitor_supplier_expenses\` = 1;
        `);
        await queryRunner.query(`
            ALTER TABLE \`accounts\`
                ADD COLUMN \`supplier_is_draft\` tinyint(1) NOT NULL DEFAULT 0
                AFTER \`supplier_payment_authorized_default\`;
        `);
        await queryRunner.query(`
            ALTER TABLE \`expenses\`
                ADD COLUMN \`is_draft\` tinyint(1) NOT NULL DEFAULT 0
                AFTER \`payment_authorized\`;
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
