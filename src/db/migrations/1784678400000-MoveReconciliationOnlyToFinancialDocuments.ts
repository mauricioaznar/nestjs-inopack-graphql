import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveReconciliationOnlyToFinancialDocuments1784678400000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // The former catalog flag assumes every use of a product/resource has
        // the same financial meaning. Reconciliation is instead a property of
        // the captured sale/expense document. Refuse to migrate if historical
        // data contradicts the agreed no-mixed-document invariant.
        const [mixedSales] = await queryRunner.query(`
            SELECT osp.order_sale_id
            FROM order_sale_products osp
            INNER JOIN products p ON p.id = osp.product_id
            INNER JOIN order_sales os ON os.id = osp.order_sale_id
            WHERE osp.active = 1
              AND os.active = 1
            GROUP BY osp.order_sale_id
            HAVING MIN(p.exclude_from_financial_summaries) = 0
               AND MAX(p.exclude_from_financial_summaries) = 1;
        `);

        const [mixedExpenses] = await queryRunner.query(`
            SELECT er.expense_id
            FROM expense_resources er
            INNER JOIN resources r ON r.id = er.resource_id
            INNER JOIN expenses e ON e.id = er.expense_id
            WHERE er.active = 1
              AND e.active = 1
            GROUP BY er.expense_id
            HAVING MIN(r.exclude_from_financial_summaries) = 0
               AND MAX(r.exclude_from_financial_summaries) = 1;
        `);

        if (mixedSales.length || mixedExpenses.length) {
            throw new Error(
                `Cannot migrate reconciliation-only documents: ${mixedSales.length} mixed sale(s) and ${mixedExpenses.length} mixed expense(s) require manual classification.`,
            );
        }

        const [salesToBackfillRows] = await queryRunner.query(`
            SELECT COUNT(DISTINCT osp.order_sale_id) AS count
            FROM order_sale_products osp
            INNER JOIN products p ON p.id = osp.product_id
            INNER JOIN order_sales os ON os.id = osp.order_sale_id
            WHERE osp.active = 1
              AND os.active = 1
              AND p.exclude_from_financial_summaries = 1;
        `);

        const [expensesToBackfillRows] = await queryRunner.query(`
            SELECT COUNT(DISTINCT er.expense_id) AS count
            FROM expense_resources er
            INNER JOIN resources r ON r.id = er.resource_id
            INNER JOIN expenses e ON e.id = er.expense_id
            WHERE er.active = 1
              AND e.active = 1
              AND r.exclude_from_financial_summaries = 1;
        `);

        await queryRunner.query(`
            ALTER TABLE order_sales
            ADD COLUMN reconciliation_only tinyint(1) NOT NULL DEFAULT '0';
        `);

        await queryRunner.query(`
            ALTER TABLE expenses
            ADD COLUMN reconciliation_only tinyint(1) NOT NULL DEFAULT '0';
        `);

        await queryRunner.query(`
            UPDATE order_sales os
            SET os.reconciliation_only = 1
            WHERE EXISTS (
                SELECT 1
                FROM order_sale_products osp
                INNER JOIN products p ON p.id = osp.product_id
                WHERE osp.order_sale_id = os.id
                  AND osp.active = 1
                  AND p.exclude_from_financial_summaries = 1
            );
        `);

        await queryRunner.query(`
            UPDATE expenses e
            SET e.reconciliation_only = 1
            WHERE EXISTS (
                SELECT 1
                FROM expense_resources er
                INNER JOIN resources r ON r.id = er.resource_id
                WHERE er.expense_id = e.id
                  AND er.active = 1
                  AND r.exclude_from_financial_summaries = 1
            );
        `);

        console.log(
            `Reconciliation-only migration backfilled ${salesToBackfillRows[0]?.count ?? 0} sale(s) and ${expensesToBackfillRows[0]?.count ?? 0} expense(s).`,
        );

        await queryRunner.query(`
            ALTER TABLE products
            DROP COLUMN exclude_from_financial_summaries;
        `);

        await queryRunner.query(`
            ALTER TABLE resources
            DROP COLUMN exclude_from_financial_summaries;
        `);
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {}
}
