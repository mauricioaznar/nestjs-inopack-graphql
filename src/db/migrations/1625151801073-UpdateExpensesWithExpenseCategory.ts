import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExpensesWithExpenseCategory1625151801073
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE expenses ADD `expense_category_id` int unsigned DEFAULT NULL;',
        );
        await queryRunner.query(
            'ALTER TABLE expenses ADD CONSTRAINT expenses_expense_categories_id FOREIGN KEY (expense_category_id) REFERENCES expense_categories(id);',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
