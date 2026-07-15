import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExpensesWithSubtotal1713588955279
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `alter table expenses add column \`subtotal\` double(12,2) NOT NULL DEFAULT 0;`,
        );

        await queryRunner.query(`
        UPDATE
            expenses
        LEFT JOIN (
            SELECT
                expense_id,
                SUM(amount) AS total
            FROM
                expense_resources 
            WHERE
                active = 1
            GROUP BY
                expense_id
        ) AS expense_sums ON
            expense_sums.expense_id = expenses.id
        SET
            expenses.subtotal = expense_sums.total
        where
            expense_sums.total is not null;
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
