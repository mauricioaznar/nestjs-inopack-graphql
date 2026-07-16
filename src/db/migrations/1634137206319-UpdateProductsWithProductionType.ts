import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProductsWithProductionType1634137206319
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE products ADD `order_production_type_id` int unsigned DEFAULT NULL;',
        );
        await queryRunner.query(
            'ALTER TABLE products ADD CONSTRAINT products_order_production_type_id_foreign FOREIGN KEY (order_production_type_id) REFERENCES order_production_type(id);',
        );
        await queryRunner.query(
            'update products set order_production_type_id = 1 where product_type_id = 1;',
        );
        await queryRunner.query(
            'update products set order_production_type_id = 2 where product_type_id = 2;',
        );
        await queryRunner.query(
            'update products set order_production_type_id = 3 where product_type_id = 3;',
        );
        await queryRunner.query(
            'update products set order_production_type_id = 4 where product_type_id = 5;',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
