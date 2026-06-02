import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderSalesWithAccountability1688425396557
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE \`order_sales\`
                ADD COLUMN \`credit_note_code\` varchar(255) NOT NULL DEFAULT '';
        `);

    await queryRunner.query(`
            ALTER TABLE \`order_sales\`
                ADD COLUMN \`credit_note_amount\` double(12,2) NOT NULL DEFAULT 0;;
        `);

    await queryRunner.query(`
            ALTER TABLE \`order_sales\`
                ADD COLUMN \`require_credit_note\` boolean NOT NULL DEFAULT 0;
        `);

    await queryRunner.query(`
            ALTER TABLE \`order_sales\`
                ADD COLUMN \`supplement_code\` varchar(255) NOT NULL DEFAULT '';
        `);

    await queryRunner.query(`
            ALTER TABLE \`order_sales\`
                ADD COLUMN \`require_supplement\` boolean NOT NULL DEFAULT 0;
        `);

    await queryRunner.query(`
            ALTER TABLE \`expenses\`
                ADD COLUMN \`supplement_code\` varchar(255) NOT NULL DEFAULT '';
        `);

    await queryRunner.query(`
            ALTER TABLE \`expenses\`
                ADD COLUMN \`require_supplement\` boolean NOT NULL DEFAULT 0;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
