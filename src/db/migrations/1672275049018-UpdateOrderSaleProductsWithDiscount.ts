import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderSaleProductsWithDiscount1672275049018
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // `kilos` double(8, 2) NOT NULL,
        await queryRunner.query(
            'ALTER TABLE order_sale_products ADD `discount` double(8, 2) not null default 0',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
