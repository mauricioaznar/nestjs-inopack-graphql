import { MigrationInterface, QueryRunner } from 'typeorm';

// Renames the two "accountability export" flags to name their true meaning:
// Inopack Notas is the INFORMAL side of the money (physical cash, never wired,
// tracked only internally). The accounting-export split is a derivation of that.
//
//   • accounts.exclude_from_accountability_export  -> accounts.is_informal_account
//       Value-preserving: it was 1 only on "Inopack Notas" (id 38), which is
//       exactly the informal account, so the flag stays 1 there.
//
//   • receipt_types.include_in_accountability_export -> receipt_types.is_informal_receipt
//       Polarity INVERTS: the export flag was 1 on the fiscal type ("Factura con
//       IVA", id 2); the informal flag is 1 on the nota type (id 1). So the column
//       is reseeded after the rename.
//
// The historical migrations that created / read these columns
// (1783795200000-AddAccountabilityExportFlags, 1784764800000-ReconcileDuplicateAccounts)
// ran before this one and are intentionally left untouched.
export class RenameInformalFlags1789300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`accounts\`
        CHANGE COLUMN \`exclude_from_accountability_export\` \`is_informal_account\` tinyint(1) NOT NULL DEFAULT '0';
    `);

        await queryRunner.query(`
      ALTER TABLE \`receipt_types\`
        CHANGE COLUMN \`include_in_accountability_export\` \`is_informal_receipt\` tinyint(1) NOT NULL DEFAULT '0';
    `);

        // Reseed with informal polarity: only the "Nota" receipt type (id 1) is
        // informal; every other type (fiscal, and the retired id 3) is formal.
        await queryRunner.query(`
      UPDATE \`receipt_types\` SET \`is_informal_receipt\` = 0;
    `);
        await queryRunner.query(`
      UPDATE \`receipt_types\` SET \`is_informal_receipt\` = 1 WHERE \`id\` = 1;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
