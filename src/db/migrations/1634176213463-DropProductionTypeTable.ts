import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProductionTypeTable1634176213463
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE materials
            DROP FOREIGN KEY materials_product_type_id_foreign`);

    await queryRunner.query(`ALTER TABLE products
            DROP FOREIGN KEY products_product_type_id_foreign`);

    await queryRunner.query(`
        ALTER TABLE materials DROP COLUMN product_type_id;
    `);

    await queryRunner.query(`
        ALTER TABLE products DROP COLUMN product_type_id;
    `);

    await queryRunner.query(`
       drop table product_type;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
