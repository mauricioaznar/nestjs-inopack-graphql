import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropOtherIncomesTable1622126053095 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE other_incomes DROP FOREIGN KEY other_incomes_supplier_id_foreign;
      `);

    await queryRunner.query(`
        DROP TABLE other_incomes
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
