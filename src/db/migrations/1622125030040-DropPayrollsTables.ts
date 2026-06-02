import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPayrollsTables1622125030040 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE payroll_payments DROP FOREIGN KEY payroll_payments_employee_id_foreign;
        `);

    await queryRunner.query(`
          ALTER TABLE payroll_payments DROP FOREIGN KEY payroll_payments_payroll_id_foreign;
      `);

    await queryRunner.query(`
          ALTER TABLE payrolls DROP FOREIGN KEY payrolls_branch_id_foreign;
      `);

    await queryRunner.query(`
          ALTER TABLE payrolls DROP FOREIGN KEY payrolls_payroll_type_id_foreign;
      `);

    await queryRunner.query(`
        DROP TABLE payrolls
    `);

    await queryRunner.query(`
        DROP TABLE payroll_type
    `);

    await queryRunner.query(`
        DROP TABLE payroll_payments
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
