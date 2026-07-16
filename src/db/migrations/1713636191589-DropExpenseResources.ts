import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropExpenseResources1713636191589 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE expense_resources DROP FOREIGN KEY expense_resources_expense_id_foreign;
    `);

        await queryRunner.query(`
      ALTER TABLE expense_resources DROP FOREIGN KEY expense_resources_resource_id_foreign;
    `);

        await queryRunner.query(`drop table expense_resources;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
