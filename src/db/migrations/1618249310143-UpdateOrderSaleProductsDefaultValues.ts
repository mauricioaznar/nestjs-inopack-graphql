import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderSaleProductsDefaultValues1618249310143
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'UPDATE `order_sale_products` SET `groups` = 0.0 WHERE `groups` IS null;',
    );
    await queryRunner.query(
      'UPDATE `order_sale_products` SET `group_weight` = 0.0 WHERE `group_weight` IS null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_products` MODIFY `groups` double(8,2) NOT NULL DEFAULT 0.0;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_products` MODIFY `group_weight` double(8,2) NOT NULL DEFAULT 0.0;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
