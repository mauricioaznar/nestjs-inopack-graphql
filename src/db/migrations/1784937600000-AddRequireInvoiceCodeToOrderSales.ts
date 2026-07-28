import { MigrationInterface, QueryRunner } from 'typeorm';

type CountRow = { count: number | string };

function rowsFrom<T>(result: unknown): T[] {
    if (!Array.isArray(result)) return [];
    if (result.length === 2 && Array.isArray(result[0]))
        return result[0] as T[];
    return result as T[];
}

async function columnExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
): Promise<boolean> {
    const rows = rowsFrom<CountRow>(
        await queryRunner.query(
            `
                SELECT COUNT(*) AS count
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = ?
                  AND column_name = ?;
            `,
            [tableName, columnName],
        ),
    );
    return Number(rows[0]?.count ?? 0) > 0;
}

export class AddRequireInvoiceCodeToOrderSales1784937600000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`order_sales\`
            ADD COLUMN \`require_invoice_code\` tinyint(1) NOT NULL DEFAULT '0'
            AFTER \`invoice_code\`;
        `);

        // These account fields already default correctly for newly created
        // clients. Bring legacy client accounts to the same defaults: every
        // client requires a complemento, and historical non-deleted sales are
        // evidence that the client should default to requiring a credit note.
        await queryRunner.query(`
            UPDATE \`accounts\`
            SET
                \`client_require_supplement\` = 1,
                \`updated_at\` = NOW()
            WHERE \`is_client\` = 1
              AND \`client_require_supplement\` <> 1;
        `);

        await queryRunner.query(`
            UPDATE \`accounts\` a
            SET
                a.client_require_credit_note = 1,
                a.updated_at = NOW()
            WHERE a.is_client = 1
              AND a.client_require_credit_note <> 1
              AND EXISTS (
                  SELECT 1
                  FROM \`order_sales\` os
                  WHERE os.account_id = a.id
                    AND os.active = 1
                    AND os.require_credit_note = 1
              );
        `);

        const supplementMismatchRows = rowsFrom<CountRow>(
            await queryRunner.query(`
                SELECT COUNT(*) AS count
                FROM \`accounts\`
                WHERE is_client = 1
                  AND client_require_supplement <> 1;
            `),
        );
        const supplementMismatches = Number(
            supplementMismatchRows[0]?.count ?? 0,
        );

        if (supplementMismatches > 0) {
            throw new Error(
                `AddRequireInvoiceCodeToOrderSales: ${supplementMismatches} client account(s) still do not require a supplement after backfill.`,
            );
        }

        const creditNoteMismatchRows = rowsFrom<CountRow>(
            await queryRunner.query(`
                SELECT COUNT(*) AS count
                FROM \`accounts\` a
                WHERE a.is_client = 1
                  AND a.client_require_credit_note <> 1
                  AND EXISTS (
                      SELECT 1
                      FROM \`order_sales\` os
                      WHERE os.account_id = a.id
                        AND os.active = 1
                        AND os.require_credit_note = 1
                  );
            `),
        );
        const creditNoteMismatches = Number(
            creditNoteMismatchRows[0]?.count ?? 0,
        );

        if (creditNoteMismatches > 0) {
            throw new Error(
                `AddRequireInvoiceCodeToOrderSales: ${creditNoteMismatches} client account(s) still do not require a credit note despite historical sales.`,
            );
        }

        // Receipt type 1 is non-taxable, so its sales cannot carry a complemento.
        // Clear the requirement on the historical rows that predate this rule.
        await queryRunner.query(`
            UPDATE \`order_sales\`
            SET \`require_supplement\` = 0
            WHERE \`receipt_type_id\` = 1;
        `);

        // Folio requirements belong to each sale/expense and are initialized
        // exclusively by receipt_types.applies_tax. Remove legacy account-level
        // defaults so account selection cannot compete with receipt selection.
        for (const columnName of [
            'client_require_invoice_code',
            'supplier_require_external_code',
        ]) {
            if (await columnExists(queryRunner, 'accounts', columnName)) {
                await queryRunner.query(`
                    ALTER TABLE \`accounts\`
                    DROP COLUMN \`${columnName}\`;
                `);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // The client defaults are enable-only data corrections. They cannot be
        // safely reverted because the migration cannot distinguish a value it
        // enabled from one an operator had already enabled manually.
        // `supplier_require_external_code` is restored only as a legacy schema
        // field; its removed values cannot be recovered. The optional
        // `client_require_invoice_code` column is not restored because it is not
        // part of the tracked pre-migration schema.
        if (
            !(await columnExists(
                queryRunner,
                'accounts',
                'supplier_require_external_code',
            ))
        ) {
            await queryRunner.query(`
                ALTER TABLE \`accounts\`
                ADD COLUMN \`supplier_require_external_code\` tinyint(1) NOT NULL DEFAULT '0'
                AFTER \`client_require_supplement\`;
            `);
        }

        await queryRunner.query(`
            ALTER TABLE \`order_sales\`
            DROP COLUMN \`require_invoice_code\`;
        `);
    }
}
