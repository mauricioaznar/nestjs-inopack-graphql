import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCancelPropertyForSalesAndExpenses1692659193742
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE \`order_sales\`
                ADD COLUMN \`canceled\` boolean NOT NULL DEFAULT 0;
        `);

    await queryRunner.query(`
            ALTER TABLE \`expenses\`
                ADD COLUMN \`canceled\` boolean NOT NULL DEFAULT 0;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
