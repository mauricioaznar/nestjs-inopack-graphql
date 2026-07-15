import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropOrderProductionResources1649118694617
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          ALTER TABLE order_production_resources DROP FOREIGN KEY order_production_resources_product_id_foreign;
      `);

        await queryRunner.query(`
          ALTER TABLE order_production_resources DROP FOREIGN KEY order_production_resources_order_production_id_foreign;
      `);

        await queryRunner.query(`
       drop table order_production_resources;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
