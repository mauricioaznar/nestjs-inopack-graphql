import { MigrationInterface, QueryRunner } from 'typeorm';

// Renames the table and its three FK constraints + indexes so the name
// reflects what the rows actually hold: products consumed during production.
// "Resources" is deliberately freed for later COGS work.
export class RenameOrderProductionResourcesToProductsConsumed1785024000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'RENAME TABLE `order_production_resources` TO `order_production_products_consumed`',
        );

        await queryRunner.query(
            'ALTER TABLE `order_production_products_consumed` DROP FOREIGN KEY `order_production_resources_machine_id_foreign`',
        );
        await queryRunner.query(
            'ALTER TABLE `order_production_products_consumed` DROP FOREIGN KEY `order_production_resources_order_production_id_foreign`',
        );
        await queryRunner.query(
            'ALTER TABLE `order_production_products_consumed` DROP FOREIGN KEY `order_production_resources_product_id_foreign`',
        );

        await queryRunner.query(
            'ALTER TABLE `order_production_products_consumed` RENAME INDEX `order_production_resources_machine_id_foreign` TO `order_production_products_consumed_machine_id_foreign`',
        );
        await queryRunner.query(
            'ALTER TABLE `order_production_products_consumed` RENAME INDEX `order_production_resources_order_production_id_foreign` TO `order_production_products_consumed_order_production_id_foreign`',
        );
        await queryRunner.query(
            'ALTER TABLE `order_production_products_consumed` RENAME INDEX `order_production_resources_product_id_foreign` TO `order_production_products_consumed_product_id_foreign`',
        );

        await queryRunner.query(
            'ALTER TABLE `order_production_products_consumed` ADD CONSTRAINT `order_production_products_consumed_machine_id_foreign` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`)',
        );
        await queryRunner.query(
            'ALTER TABLE `order_production_products_consumed` ADD CONSTRAINT `order_production_products_consumed_order_production_id_foreign` FOREIGN KEY (`order_production_id`) REFERENCES `order_productions` (`id`)',
        );
        await queryRunner.query(
            'ALTER TABLE `order_production_products_consumed` ADD CONSTRAINT `order_production_products_consumed_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
