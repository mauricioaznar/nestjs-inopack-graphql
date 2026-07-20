import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecurringExpenses1784400000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`accounts\`
        ADD COLUMN \`supplier_recurring_expenses\` tinyint(1) NOT NULL DEFAULT '0';
    `);

        await queryRunner.query(`
      ALTER TABLE \`expenses\`
        ADD COLUMN \`generated_from_expense_id\` int unsigned NULL,
        ADD INDEX \`expenses_generated_from_expense_id_idx\` (\`generated_from_expense_id\`),
        ADD CONSTRAINT \`expenses_generated_from_expense_id_foreign\`
          FOREIGN KEY (\`generated_from_expense_id\`) REFERENCES \`expenses\`(\`id\`)
          ON DELETE SET NULL ON UPDATE NO ACTION;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
