import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Comment + pending-document tracking for sales and expenses.
 *
 * Two parallel tables rather than a polymorphic pattern — the codebase has no
 * polymorphic relations, so each comment table owns a plain FK to its parent
 * (`order_sale_id` / `expense_id`). Both mirror the shape used elsewhere:
 * `active` soft-delete flag, nullable `created_at` / `updated_at`, and a
 * `created_by_id` audit stamp FK to `users` (the same relation pattern already
 * on `order_sales` / `expenses`).
 *
 * `requires_pending_document` gates `pending_document_delivered` and
 * `document_name`; the second checkbox is only meaningful when the first is on.
 *
 * This migration also carries two unrelated-but-concurrent schema moves for the
 * same feature branch, both one-way (no `down` reversal, by request):
 *
 *  - `payment_authorized`: a per-expense "the payment is authorized" flag, with
 *    an account-level default (`supplier_payment_authorized_default`). Both
 *    default ON; only monitored-balance suppliers
 *    (`accounts.monitor_supplier_expenses = 1`) start OFF, because those are the
 *    accounts whose payments still need explicit sign-off.
 *  - Dropping the stale `expense_statuses` feature (the color "status" icon):
 *    the `expenses.expense_status_id` FK/column and the `expense_statuses` table
 *    are removed outright.
 */
export class CreateSaleAndExpenseComments1786046400000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`order_sale_comments\`
            (
                \`id\`                        int unsigned NOT NULL AUTO_INCREMENT,
                \`active\`                    int          NOT NULL DEFAULT '1',
                \`created_at\`                datetime     NULL     DEFAULT NULL,
                \`updated_at\`                datetime     NULL     DEFAULT NULL,
                \`body\`                      text         NOT NULL,
                \`order_sale_id\`             int unsigned NULL     DEFAULT NULL,
                \`created_by_id\`             int unsigned NULL     DEFAULT NULL,
                \`requires_pending_document\` tinyint(1)   NOT NULL DEFAULT '0',
                \`pending_document_delivered\` tinyint(1)  NOT NULL DEFAULT '0',
                \`document_name\`             varchar(255) NOT NULL DEFAULT '',
                PRIMARY KEY (\`id\`),
                KEY \`order_sale_comments_order_sale_id_foreign\` (\`order_sale_id\`),
                KEY \`order_sale_comments_created_by_id_foreign\` (\`created_by_id\`),
                CONSTRAINT \`order_sale_comments_order_sale_id_foreign\`
                    FOREIGN KEY (\`order_sale_id\`) REFERENCES \`order_sales\` (\`id\`)
                    ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`order_sale_comments_created_by_id_foreign\`
                    FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\` (\`id\`)
                    ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE = InnoDB
              AUTO_INCREMENT = 1
              DEFAULT CHARSET = utf8
              COLLATE = utf8_unicode_ci;
        `);

        await queryRunner.query(`
            CREATE TABLE \`expense_comments\`
            (
                \`id\`                        int unsigned NOT NULL AUTO_INCREMENT,
                \`active\`                    int          NOT NULL DEFAULT '1',
                \`created_at\`                datetime     NULL     DEFAULT NULL,
                \`updated_at\`                datetime     NULL     DEFAULT NULL,
                \`body\`                      text         NOT NULL,
                \`expense_id\`                int unsigned NULL     DEFAULT NULL,
                \`created_by_id\`             int unsigned NULL     DEFAULT NULL,
                \`requires_pending_document\` tinyint(1)   NOT NULL DEFAULT '0',
                \`pending_document_delivered\` tinyint(1)  NOT NULL DEFAULT '0',
                \`document_name\`             varchar(255) NOT NULL DEFAULT '',
                PRIMARY KEY (\`id\`),
                KEY \`expense_comments_expense_id_foreign\` (\`expense_id\`),
                KEY \`expense_comments_created_by_id_foreign\` (\`created_by_id\`),
                CONSTRAINT \`expense_comments_expense_id_foreign\`
                    FOREIGN KEY (\`expense_id\`) REFERENCES \`expenses\` (\`id\`)
                    ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`expense_comments_created_by_id_foreign\`
                    FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\` (\`id\`)
                    ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE = InnoDB
              AUTO_INCREMENT = 1
              DEFAULT CHARSET = utf8
              COLLATE = utf8_unicode_ci;
        `);

        // --- Payment authorization -------------------------------------------
        // Account-level default that seeds new expenses. ON everywhere except
        // monitored-balance suppliers, which keep needing explicit sign-off.
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

        // Per-expense flag. Backfill mirrors the account default: authorized
        // unless the expense belongs to a monitored-balance supplier.
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

        // --- Drop the stale expense-status feature ---------------------------
        // The color "status" icon went stale and is being removed outright.
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

    // Only the comment tables are reversible. The payment-authorization columns
    // and the expense-status teardown are intentionally one-way (see the class
    // doc): re-adding a dropped table with lost rows would be a false rollback.
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP TABLE IF EXISTS \`order_sale_comments\`;`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS \`expense_comments\`;`);
    }
}
