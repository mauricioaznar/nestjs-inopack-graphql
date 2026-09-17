import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountReconciliationOnlyDefaults1785960000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Account-level defaults for the document-level `reconciliation_only`
        // flag. Selecting an account on a form seeds that document's
        // reconciliation_only from the matching account flag: the CLIENT flag on
        // the order-sale form, the SUPPLIER flag on the expense form. An account
        // is frequently both a client and a supplier, so the two are kept
        // independent. No backfill — existing documents are untouched and both
        // flags default off; they only shape NEW documents going forward.
        await queryRunner.query(`
            ALTER TABLE accounts
            ADD COLUMN client_reconciliation_only tinyint(1) NOT NULL DEFAULT '0' AFTER client_automatic_tax_calculation,
            ADD COLUMN supplier_reconciliation_only tinyint(1) NOT NULL DEFAULT '0' AFTER client_reconciliation_only;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE accounts
            DROP COLUMN client_reconciliation_only,
            DROP COLUMN supplier_reconciliation_only;
        `);
    }
}
