import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExpenseResourcesUnitPrice1770660152757
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `expense_resources` MODIFY `unit_price` double(12,2) DEFAULT 0.0;',
        );

        await queryRunner.query(
            'ALTER TABLE `expenses` MODIFY `resources_total` double(12,2) DEFAULT 0.0;',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
