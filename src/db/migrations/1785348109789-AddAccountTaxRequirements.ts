import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountTaxRequirements1785348109789
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE accounts
            ADD COLUMN supplier_requires_external_code tinyint(1) NOT NULL DEFAULT '1' AFTER supplier_require_supplement,
            ADD COLUMN supplier_requires_tax tinyint(1) NOT NULL DEFAULT '1' AFTER supplier_requires_external_code,
            ADD COLUMN client_requires_invoice_code tinyint(1) NOT NULL DEFAULT '1' AFTER client_require_supplement,
            ADD COLUMN client_requires_tax tinyint(1) NOT NULL DEFAULT '1' AFTER client_requires_invoice_code;
        `);
        await queryRunner.query(`
            ALTER TABLE order_sales
            ADD COLUMN require_tax tinyint(1) NOT NULL DEFAULT '0' AFTER require_invoice_code;
        `);
        await queryRunner.query(`
            ALTER TABLE expenses
            ADD COLUMN require_tax tinyint(1) NOT NULL DEFAULT '0' AFTER require_external_code;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE expenses
            DROP COLUMN require_tax;
        `);
        await queryRunner.query(`
            ALTER TABLE order_sales
            DROP COLUMN require_tax;
        `);
        await queryRunner.query(`
            ALTER TABLE accounts
            DROP COLUMN supplier_requires_external_code,
            DROP COLUMN supplier_requires_tax,
            DROP COLUMN client_requires_invoice_code,
            DROP COLUMN client_requires_tax;
        `);
    }
}
