import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProductsTableWithGroupPrice1686343667556
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `alter table products add column \`current_group_price\` double(12,2) NOT NULL DEFAULT 0;`,
        );

        await queryRunner.query(
            `alter table order_request_products add column \`group_price\` double(12,2) NOT NULL DEFAULT 0;`,
        );

        await queryRunner.query(
            `alter table order_sale_products add column \`group_price\` double(12,2) NOT NULL DEFAULT 0;`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
