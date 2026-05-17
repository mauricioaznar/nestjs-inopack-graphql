import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderRequestProductsDefaultValues1618249287029
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'UPDATE `order_request_products` SET `groups` = 0.0 WHERE `groups` IS null;',
    );
    await queryRunner.query(
      'UPDATE `order_request_products` SET `group_weight` = 0.0 WHERE `group_weight` IS null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_request_products` MODIFY `groups` double(8,2) NOT NULL DEFAULT 0.0;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_request_products` MODIFY `group_weight` double(8,2) NOT NULL DEFAULT 0.0;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
