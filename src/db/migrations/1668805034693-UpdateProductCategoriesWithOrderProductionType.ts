import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProductCategoriesWithOrderProductionType1668805034693
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE product_categories ADD `order_production_type_id` int unsigned DEFAULT NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE product_categories ADD CONSTRAINT product_categories_order_production_type_id_foreign FOREIGN KEY (order_production_type_id) REFERENCES order_production_type(id);',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
