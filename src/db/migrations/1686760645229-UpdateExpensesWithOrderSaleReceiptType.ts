import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExpensesWithOrderSaleReceiptType1686760645229
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE \`expenses\` 
                ADD COLUMN \`receipt_type_id\` int unsigned, 
                ADD CONSTRAINT \`expenses_receipt_type_foreign\` FOREIGN KEY (\`receipt_type_id\`) 
                REFERENCES \`order_sale_receipt_type\`(\`id\`);
        `);

    await queryRunner.query(`
        ALTER TABLE order_sales
        DROP FOREIGN KEY order_sales_order_sale_receipt_type_id_foreign;
    `);

    await queryRunner.query(`
        ALTER TABLE order_sales
        CHANGE order_sale_receipt_type_id receipt_type_id int unsigned DEFAULT NULL;
    `);

    await queryRunner.query(`
        ALTER TABLE order_sale_receipt_type RENAME receipt_types;
    `);

    await queryRunner.query(`
        ALTER TABLE order_sales
        ADD CONSTRAINT order_sales_receipt_type_foreign FOREIGN KEY (receipt_type_id)
        REFERENCES receipt_types(id);
    `);

    await queryRunner.query(`
            ALTER TABLE \`expenses\`
                ADD COLUMN \`notes\` varchar(255) NOT NULL DEFAULT '';
        `);

    await queryRunner.query(`
            ALTER TABLE \`expenses\`
                ADD COLUMN \`tax\`  double(12 ,2) unsigned NOT NULL DEFAULT 0;
        `);

    await queryRunner.query(`
            ALTER TABLE \`expenses\`
                ADD COLUMN \`tax_retained\`  double(12 ,2) unsigned NOT NULL DEFAULT 0;
        `);

    await queryRunner.query(`
            ALTER TABLE \`expenses\`
                ADD COLUMN \`non_tax_retained\`  double(12 ,2) unsigned NOT NULL DEFAULT 0;
        `);

    await queryRunner.query(`
            ALTER TABLE \`expenses\`
                ADD COLUMN \`non_tax\`  double(12 ,2) unsigned NOT NULL DEFAULT 0;
        `);

    // `amount` double(12 ,2) unsigned NOT NULL,
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
