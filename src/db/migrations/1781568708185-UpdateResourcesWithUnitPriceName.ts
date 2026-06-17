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
      'ALTER TABLE `expenses` RENAME COLUMN `order_code` TO `external_code`;',
    );

    await queryRunner.query(
      'ALTER TABLE `expenses` RENAME COLUMN `require_order_code` TO `require_external_code`;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
