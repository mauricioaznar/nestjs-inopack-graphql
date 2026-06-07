import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationSetup1616190017017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `migrations` ADD COLUMN `timestamp` bigint NOT NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `migrations` ADD COLUMN `name` VARCHAR(255) NOT NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `migrations` DROP COLUMN `migration`;',
    );
    await queryRunner.query('ALTER TABLE `migrations` DROP COLUMN `batch`;');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
