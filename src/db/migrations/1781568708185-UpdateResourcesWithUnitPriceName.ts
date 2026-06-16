import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateResourcesWithUnitPriceName1781568708185
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `resources` ADD `unit_price_name` varchar(255) NULL;',
    );

    await queryRunner.query(
      'ALTER TABLE `expenses` ADD `invoice_code` int NOT NULL DEFAULT 0;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
