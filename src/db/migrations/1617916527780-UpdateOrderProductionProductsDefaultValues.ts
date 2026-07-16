import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderProductionProductsDefaultValues1617916527780
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'UPDATE `order_production_products` SET `groups` = 0.0 WHERE `groups` IS null;',
        );
        await queryRunner.query(
            'UPDATE `order_production_products` SET `group_weight` = 0.0 WHERE `group_weight` IS null;',
        );
        await queryRunner.query(
            'ALTER TABLE `order_production_products` MODIFY `groups` double(8,2) NOT NULL DEFAULT 0.0;',
        );
        await queryRunner.query(
            'ALTER TABLE `order_production_products` MODIFY `group_weight` double(8,2) NOT NULL DEFAULT 0.0;',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
