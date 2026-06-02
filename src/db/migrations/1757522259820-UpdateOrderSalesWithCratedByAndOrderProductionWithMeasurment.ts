import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderSalesWithCratedByAndOrderProductionWithMeasurment1757522259820
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
                ALTER TABLE \`order_sales\`
                    ADD COLUMN \`created_by_id\` int unsigned default null,
                    ADD CONSTRAINT \`order_sales_created_by_id_foreign\` FOREIGN KEY (\`created_by_id\`)
                    REFERENCES \`users\`(\`id\`);
            `);

    await queryRunner.query(
      'ALTER TABLE products ADD `pleat` double(12, 2) default null;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
