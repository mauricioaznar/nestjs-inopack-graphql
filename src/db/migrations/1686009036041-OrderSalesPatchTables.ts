import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderSalesPatchTables1686009036041 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE order_sales DROP FOREIGN KEY order_sales_order_sale_collection_status_id_foreign;
      `);

    await queryRunner.query(`
          ALTER TABLE order_sales DROP COLUMN order_sale_collection_status_id;
      `);

    await queryRunner.query(`
          ALTER TABLE order_sales DROP FOREIGN KEY order_sales_order_sale_payment_type_id_foreign;
      `);

    await queryRunner.query(`
          ALTER TABLE order_sales DROP COLUMN order_sale_payment_type_id;
      `);

    await queryRunner.query(`
          ALTER TABLE order_sales DROP COLUMN amount_collected;
      `);

    await queryRunner.query(`
          ALTER TABLE order_sales DROP COLUMN date_collected;
      `);

    await queryRunner.query(`
          ALTER TABLE order_sale_payments DROP FOREIGN KEY order_sale_payments_order_sale_id_foreign;
      `);

    await queryRunner.query(`
          ALTER TABLE order_sale_payments DROP FOREIGN KEY order_sale_payments_order_sale_collection_status_id_foreign;
      `);

    await queryRunner.query(`
       drop table order_sale_payments;
    `);

    await queryRunner.query(`
       drop table order_sale_collection_statuses;
    `);

    await queryRunner.query(`
       drop table order_sale_payment_type;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
