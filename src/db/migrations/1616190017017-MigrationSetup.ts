import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationSetup1616190017017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `migrations` ADD COLUMN IF NOT EXISTS `timestamp` bigint NOT NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `migrations` ADD COLUMN IF NOT EXISTS `name` VARCHAR(255) NOT NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `migrations` DROP COLUMN IF EXISTS `migration`;',
    );
    await queryRunner.query(
      'ALTER TABLE `migrations` DROP COLUMN IF EXISTS `batch`;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
