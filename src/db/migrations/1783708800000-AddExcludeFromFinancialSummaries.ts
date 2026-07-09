import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExcludeFromFinancialSummaries1783708800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Replaces the hardcoded loan identifiers (product 196 / resource 14)
    // scattered in the summary services with a declared flag. Flagged items
    // are excluded from principal totals in financial summaries; tax always
    // counts regardless of the flag.
    await queryRunner.query(`
      ALTER TABLE \`products\`
        ADD COLUMN \`exclude_from_financial_summaries\` tinyint(1) NOT NULL DEFAULT '0';
    `);

    await queryRunner.query(`
      ALTER TABLE \`resources\`
        ADD COLUMN \`exclude_from_financial_summaries\` tinyint(1) NOT NULL DEFAULT '0';
    `);

    // Seed: the two loan ("Prestamo"/"Prestamos") records.
    await queryRunner.query(`
      UPDATE \`products\` SET \`exclude_from_financial_summaries\` = 1 WHERE \`id\` = 196;
    `);

    await queryRunner.query(`
      UPDATE \`resources\` SET \`exclude_from_financial_summaries\` = 1 WHERE \`id\` = 14;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
