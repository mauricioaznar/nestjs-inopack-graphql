import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExpensesAndSalesWithIncludeUnitsInSummary1764948959077
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`products\`
                ADD COLUMN \`include_units_in_summary\` boolean NOT NULL DEFAULT 1;
        `);

        await queryRunner.query(
            'ALTER TABLE resources ADD `include_units_in_summary` boolean NOT NULL DEFAULT 0;',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
