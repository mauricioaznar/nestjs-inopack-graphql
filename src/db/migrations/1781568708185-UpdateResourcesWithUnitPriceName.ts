import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateResourcesWithUnitPriceName1781568708185
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `resources` ADD `unit_price_name` varchar(255) NULL;',
    );

    await queryRunner.query(
      'ALTER TABLE `expenses` ADD `internal_code` int NOT NULL DEFAULT 0;',
    );

    await queryRunner.query(
      'ALTER TABLE `expenses` CHANGE COLUMN `order_code` `external_code` varchar(255) NOT NULL DEFAULT \'\';',
    );

    await queryRunner.query(
      'ALTER TABLE `expenses` CHANGE COLUMN `require_order_code` `require_external_code` tinyint(1) NOT NULL DEFAULT 1;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
