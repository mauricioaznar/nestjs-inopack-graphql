import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderSalesDefaultValues1618064683790
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `order_sales` ALTER `amount_collected` SET DEFAULT 0;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sales` ALTER `invoice_code` SET DEFAULT 0;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
