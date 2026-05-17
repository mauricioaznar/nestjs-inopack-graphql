import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderAdjustmentsWithOrderSale1713377949052
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE \`order_adjustments\` 
                ADD COLUMN \`order_sale_id\` int unsigned DEFAULT null, 
                ADD CONSTRAINT \`order_adjustments_order_sale_id_foreign\` FOREIGN KEY (\`order_sale_id\`) 
                REFERENCES \`order_sales\`(\`id\`);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
