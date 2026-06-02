import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEmployeesDefaultValues1617828692810
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `employees` ALTER `first_name` SET DEFAULT '';",
    );
    await queryRunner.query(
      "ALTER TABLE `employees` ALTER `last_name` SET DEFAULT '';",
    );
    await queryRunner.query(
      "ALTER TABLE `employees` ALTER `cellphone` SET DEFAULT '';",
    );
    await queryRunner.query(
      "ALTER TABLE `employees` ALTER `email` SET DEFAULT '';",
    );
    await queryRunner.query(
      "ALTER TABLE `employees` ALTER `fullname` SET DEFAULT '';",
    );
    await queryRunner.query(
      'ALTER TABLE `employees` ALTER `base_salary` SET DEFAULT 0.00;',
    );
    await queryRunner.query(
      'ALTER TABLE `employees` ALTER `hours_should_work` SET DEFAULT 0.00;',
    );
    await queryRunner.query(
      'ALTER TABLE `employees` ALTER `infonavit` SET DEFAULT 0.00;',
    );
    await queryRunner.query(
      'ALTER TABLE `employees` ALTER `credit` SET DEFAULT 0.00;',
    );
    await queryRunner.query(
      'ALTER TABLE `employees` ALTER `credit_required` SET DEFAULT 0;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
