import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropExpensesTables1642354417919 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE suppliers DROP FOREIGN KEY suppliers_default_expense_type_id_foreign;
      `);

    await queryRunner.query(`
          ALTER TABLE suppliers DROP FOREIGN KEY suppliers_default_expense_subcategory_id_foreign;
      `);

    await queryRunner.query(`
          ALTER TABLE suppliers DROP FOREIGN KEY suppliers_default_expense_money_source_id_foreign;
      `);

    await queryRunner.query(`
          ALTER TABLE suppliers DROP COLUMN default_expense_money_source_id;
    `);

    await queryRunner.query(`
          ALTER TABLE suppliers DROP COLUMN default_expense_subcategory_id;
    `);

    await queryRunner.query(`
          ALTER TABLE suppliers DROP COLUMN default_expense_type_id;
    `);

    // items
    await queryRunner.query(`
       drop table expense_items;
    `);

    // invoice complements
    await queryRunner.query(`
       drop table expense_invoice_complements;
    `);

    // expense credit notes
    await queryRunner.query(`
       drop table expense_credit_notes;
    `);

    // payments
    await queryRunner.query(`
       drop table expense_payments;
    `);

    // products
    await queryRunner.query(`
       drop table expense_products;
    `);

    // expenses
    await queryRunner.query(`
       drop table expenses;
    `);

    await queryRunner.query(`
       drop table expense_invoice_cdfi_uses;
    `);

    await queryRunner.query(`
       drop table expense_invoice_payment_forms;
    `);

    await queryRunner.query(`
       drop table expense_invoice_payment_methods;
    `);

    await queryRunner.query(`
       drop table expense_invoice_statuses;
    `);

    await queryRunner.query(`
       drop table expense_invoice_type;
    `);

    await queryRunner.query(`
       drop table expense_money_sources;
    `);

    await queryRunner.query(`
       drop table expense_statuses;
    `);

    await queryRunner.query(`
       drop table expense_subcategories_estcosts;
    `);

    await queryRunner.query(`
       drop table material_esproportions;
    `);

    await queryRunner.query(`
       drop table expense_subcategories;
    `);

    await queryRunner.query(`
       drop table expense_subcategory_frequencies;
    `);

    await queryRunner.query(`
       drop table expense_type;
    `);

    await queryRunner.query(`
       drop table expense_categories;
    `);

    await queryRunner.query(`
       drop table suppliers;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
