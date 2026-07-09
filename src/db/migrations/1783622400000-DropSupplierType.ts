import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropSupplierType1783622400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // supplier_type is redundant: account/expense classification now lives on
    // resources (accounts.resource_id + expense_resources.resource_id). The
    // earlier CreateExpenseResources migration already backfilled
    // accounts.resource_id from supplier_type.resource_id, so no data is lost.

    // Remove the accounts -> supplier_type link first (FK, then column).
    await queryRunner.query(`
      ALTER TABLE \`accounts\`
        DROP FOREIGN KEY \`suppliers_supplier_type_id_foreign\`;
    `);

    await queryRunner.query(`
      ALTER TABLE \`accounts\`
        DROP COLUMN \`supplier_type_id\`;
    `);

    // Dropping the table also drops its own supplier_type_resource_id_foreign FK.
    await queryRunner.query(`
      DROP TABLE \`supplier_type\`;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
