import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAccountsWithMonitorBalance1765484011264
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE accounts ADD `monitor_balance` boolean NOT NULL DEFAULT 0;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
