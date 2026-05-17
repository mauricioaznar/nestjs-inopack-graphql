import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderProductionProductsWithHours1714499472542
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE order_production_products ADD `hours` double(12, 2) default null;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
