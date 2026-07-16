import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountabilityExportFlags1783795200000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Replaces two hardcoded IDs in the React accountability export / balances
        // view split with declared flags:
        //   • accounts.exclude_from_accountability_export  (was account_id === 38)
        //   • receipt_types.include_in_accountability_export (was receipt_type_id === 2)
        await queryRunner.query(`
      ALTER TABLE \`accounts\`
        ADD COLUMN \`exclude_from_accountability_export\` tinyint(1) NOT NULL DEFAULT '0';
    `);

        await queryRunner.query(`
      ALTER TABLE \`receipt_types\`
        ADD COLUMN \`include_in_accountability_export\` tinyint(1) NOT NULL DEFAULT '0';
    `);

        // Seed: "Inopack Notas" own account (38) is excluded from the export;
        // "Factura con IVA" receipt type (2) is the only one included.
        await queryRunner.query(`
      UPDATE \`accounts\` SET \`exclude_from_accountability_export\` = 1 WHERE \`id\` = 38;
    `);

        await queryRunner.query(`
      UPDATE \`receipt_types\` SET \`include_in_accountability_export\` = 1 WHERE \`id\` = 2;
    `);

        // Retire the "Reposicion" receipt type (id 3). With the export split now
        // driven by include_in_accountability_export, a non-flagged type 3 would
        // otherwise surface in the non-fiscal balances view; soft-delete it instead.
        await queryRunner.query(`
      UPDATE \`receipt_types\` SET \`active\` = -1 WHERE \`id\` = 3;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
