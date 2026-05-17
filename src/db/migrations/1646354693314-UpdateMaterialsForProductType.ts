import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMaterialsForProductType1646354693314
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE materials RENAME TO product_type;');
    await queryRunner.query(
      `ALTER TABLE products DROP FOREIGN KEY products_material_id_foreign;`,
    );
    await queryRunner.query(
      `ALTER TABLE products CHANGE material_id product_type_id int unsigned DEFAULT NULL;`,
    );
    await queryRunner.query(
      `ALTER TABLE products ADD CONSTRAINT products_product_type_id_foreign foreign key (product_type_id) REFERENCES product_type(id);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
