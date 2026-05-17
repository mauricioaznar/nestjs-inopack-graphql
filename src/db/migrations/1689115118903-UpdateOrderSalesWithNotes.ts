import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderSalesWithNotes1689115118903
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE \`order_sales\`
                ADD COLUMN \`notes\` varchar(255) NOT NULL DEFAULT '';
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
