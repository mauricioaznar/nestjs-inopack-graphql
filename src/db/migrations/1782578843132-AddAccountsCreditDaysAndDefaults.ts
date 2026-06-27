import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountsCreditDaysAndDefaults1782578843132
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Credit terms + default flags per account, used to pre-fill the matching
    // fields on order sales (client_*) and expenses (supplier_*).
    await queryRunner.query(
      'ALTER TABLE accounts ADD `client_credit_days` int NOT NULL DEFAULT 0;',
    );
    await queryRunner.query(
      'ALTER TABLE accounts ADD `supplier_credit_days` int NOT NULL DEFAULT 0;',
    );
    await queryRunner.query(
      'ALTER TABLE accounts ADD `client_require_credit_note` boolean NOT NULL DEFAULT 0;',
    );
    await queryRunner.query(
      'ALTER TABLE accounts ADD `client_require_supplement` boolean NOT NULL DEFAULT 1;',
    );
    await queryRunner.query(
      'ALTER TABLE accounts ADD `supplier_require_external_code` boolean NOT NULL DEFAULT 0;',
    );
    await queryRunner.query(
      'ALTER TABLE accounts ADD `supplier_require_supplement` boolean NOT NULL DEFAULT 0;',
    );
    await queryRunner.query(
      'ALTER TABLE accounts ADD `client_automatic_tax_calculation` boolean NOT NULL DEFAULT 1;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE accounts DROP COLUMN `client_credit_days`;',
    );
    await queryRunner.query(
      'ALTER TABLE accounts DROP COLUMN `supplier_credit_days`;',
    );
    await queryRunner.query(
      'ALTER TABLE accounts DROP COLUMN `client_require_credit_note`;',
    );
    await queryRunner.query(
      'ALTER TABLE accounts DROP COLUMN `client_require_supplement`;',
    );
    await queryRunner.query(
      'ALTER TABLE accounts DROP COLUMN `supplier_require_external_code`;',
    );
    await queryRunner.query(
      'ALTER TABLE accounts DROP COLUMN `supplier_require_supplement`;',
    );
    await queryRunner.query(
      'ALTER TABLE accounts DROP COLUMN `client_automatic_tax_calculation`;',
    );
  }
}
