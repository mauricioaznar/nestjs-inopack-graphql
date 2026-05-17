import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderSalesWithAccount1701207669088
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE \`order_sales\` 
                ADD COLUMN \`account_id\` int unsigned DEFAULT null, 
                ADD CONSTRAINT \`order_sales_account_id_foreign\` FOREIGN KEY (\`account_id\`) 
                REFERENCES \`accounts\`(\`id\`);
        `);

    await queryRunner.query(
      `ALTER TABLE order_sales DROP FOREIGN KEY order_sales_order_request_id_foreign;`,
    );
    await queryRunner.query(
      `ALTER TABLE order_sales MODIFY order_request_id int unsigned DEFAULT NULL;`,
    );
    await queryRunner.query(
      `ALTER TABLE order_sales ADD CONSTRAINT order_sales_order_request_id_foreign foreign key (order_request_id) REFERENCES order_requests(id);`,
    );

    await queryRunner.query(
      'ALTER TABLE accounts ADD `requires_order_request` boolean not null default 1',
    );
    await queryRunner.query(`
      UPDATE order_sales
      INNER JOIN order_requests ON order_requests.id = order_sales.order_request_id
      SET order_sales.account_id = order_requests.account_id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
