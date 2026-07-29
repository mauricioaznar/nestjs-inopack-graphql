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

        // These supplier accounts use taxable receipts but do not require an
        // external folio by default.
        const noExternalCodeResult = await queryRunner.query(`
            UPDATE accounts
            SET supplier_requires_external_code = 0,
                supplier_requires_tax = 1
            WHERE id IN (
                155, -- Mauricio Aznar Rivas - Cheques
                100, -- Raul Fernando Aznar Ceballos
                59,  -- Nominas Cheques
                222, -- Fernando Aznar Rivas - Cheques
                56,  -- Banorte
                186, -- AB&C Leasing
                135  -- Control Integral de Combustibles
            );
        `);
        this.assertAffectedAccounts(noExternalCodeResult, 7, 'folio exceptions');

        // These supplier accounts require an external folio but do not require
        // tax by default.
        const noTaxResult = await queryRunner.query(`
            UPDATE accounts
            SET supplier_requires_external_code = 1,
                supplier_requires_tax = 0
            WHERE id IN (
                58,  -- IMSS
                70,  -- Canacintra; historical nonzero tax rows were capture errors
                54,  -- Secretaria de administracion y finanzas (SAT)
                122, -- Gobierno del estado de Yucatan; historical exceptions were capture errors
                92,  -- Ruian Bonada Machinery
                382, -- Li Wang Hang
                42,  -- Bepensa
                150, -- Bancomer
                189, -- Maersk
                219, -- Sterling Polymers
                159, -- Nanjing Benfu Machinery
                290, -- Beatriz Castillo Bolio
                281, -- Zhengzhou Thoyu Mechanical And Electrical Equipment Co Ltd
                152, -- Polystar
                226, -- Henan Honest Heavy Machinery
                364, -- Greenstar Plastics
                317, -- SAMS
                294, -- Ruian Gongying Machinery
                269, -- Canvas Factory
                268, -- Coemter
                259, -- Qiuxian Shengyou Trading
                235, -- Infonavit
                224, -- Henan Shuliy Machinery
                137, -- Facturama
                94   -- Rodamientos y accesorios
            );
        `);
        this.assertAffectedAccounts(noTaxResult, 25, 'tax exceptions');

        // These client accounts do not require an invoice folio, but taxable
        // receipt type 2 still requires IVA.
        const clientNoInvoiceCodeResult = await queryRunner.query(`
            UPDATE accounts
            SET client_requires_invoice_code = 0,
                client_requires_tax = 1
            WHERE id IN (
                100, -- Raul Fernando Aznar Ceballos
                87,  -- Servicios comerciales interamerica
                56,  -- Banorte
                189, -- Maersk
                264, -- Mauricio Aznar Rivas - Efectivo
                265, -- Fernando Aznar Rivas - Efectivo
                280, -- Manufacturas Salmon
                133, -- DESCONOCIDO
                181, -- Grupo Simsa
                208, -- Ingenieria Total y Control
                150  -- Bancomer
            );
        `);
        this.assertAffectedAccounts(
            clientNoInvoiceCodeResult,
            11,
            'client invoice-code exceptions',
        );

        // Receipt type 2 is the taxable receipt type. Backfill the new document
        // flag before applying the approved account-specific exceptions below.
        await queryRunner.query(`
            UPDATE order_sales
            SET require_tax = 1
            WHERE receipt_type_id = 2;
        `);
        await queryRunner.query(`
            UPDATE expenses
            SET require_tax = 1
            WHERE receipt_type_id = 2;
        `);

        // Keep historical taxable expenses aligned with the seven approved
        // supplier accounts that require IVA but not an external folio.
        await queryRunner.query(`
            UPDATE expenses
            SET require_external_code = 0,
                require_tax = 1
            WHERE receipt_type_id = 2
              AND account_id IN (155, 100, 59, 222, 56, 186, 135);
        `);

        // Keep historical taxable expenses aligned with the approved suppliers
        // that require an external folio but do not require IVA.
        await queryRunner.query(`
            UPDATE expenses
            SET require_external_code = 1,
                require_tax = 0
            WHERE receipt_type_id = 2
              AND account_id IN (
                  58, 70, 54, 122, 92, 382, 42, 150, 189, 219,
                  159, 290, 281, 152, 226, 364, 317, 294, 269,
                  268, 259, 235, 224, 137, 94
              );
        `);

        // Keep historical taxable sales aligned with the approved clients that
        // do not require an invoice folio but do require IVA.
        await queryRunner.query(`
            UPDATE order_sales
            SET require_invoice_code = 0,
                require_tax = 1
            WHERE receipt_type_id = 2
              AND account_id IN (
                  100, 87, 56, 189, 264, 265,
                  280, 133, 181, 208, 150
              );
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

    private assertAffectedAccounts(
        result: unknown,
        expected: number,
        label: string,
    ): void {
        const updatePacket = Array.isArray(result) ? result[0] : result;
        const affected =
            (updatePacket as { affectedRows?: number; changedRows?: number })
                ?.affectedRows ??
            (updatePacket as { changedRows?: number })?.changedRows ??
            0;

        if (affected !== expected) {
            throw new Error(
                `Expected to update ${expected} account ${label}, but ${affected} rows were affected. ` +
                    'Verify the hardcoded account IDs before proceeding.',
            );
        }
    }
}
