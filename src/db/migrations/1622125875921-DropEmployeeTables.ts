import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropEmployeeTables1622125875921 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          ALTER TABLE employee_attendances DROP FOREIGN KEY employee_attendances_employee_id_foreign;
      `);

        await queryRunner.query(`
        DROP TABLE employee_attendances
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
