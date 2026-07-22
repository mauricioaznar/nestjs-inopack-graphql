import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaxRateToReceiptTypes1784592000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`receipt_types\`
        ADD COLUMN \`tax_rate\` decimal(5,4) NOT NULL DEFAULT 0.0000;
    `);

        const result = await queryRunner.query(`
      UPDATE \`receipt_types\`
         SET \`tax_rate\` = 0.1600
       WHERE \`id\` = 2 AND \`active\` = 1;
    `);

        const affected = result?.affectedRows ?? result?.changedRows ?? 0;
        if (affected !== 1) {
            throw new Error(
                `Expected to seed tax_rate on exactly 1 receipt type (id 2), but ${affected} rows were affected. ` +
                    `Verify the receipt_types catalog before proceeding.`,
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`receipt_types\`
        DROP COLUMN \`tax_rate\`;
    `);
    }
}
