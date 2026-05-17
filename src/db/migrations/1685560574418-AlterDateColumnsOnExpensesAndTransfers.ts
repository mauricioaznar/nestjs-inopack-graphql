import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterDateColumnsOnExpensesAndTransfers1685560574418
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE transfers MODIFY transferred_date datetime NOT NULL;
        `);

    await queryRunner.query(`
            ALTER TABLE expenses MODIFY date datetime NOT NULL;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
