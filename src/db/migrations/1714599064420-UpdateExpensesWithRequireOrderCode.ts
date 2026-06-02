import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExpensesWithRequireOrderCode1714599064420
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE expenses ADD `require_order_code` boolean NOT NULL default 1;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
