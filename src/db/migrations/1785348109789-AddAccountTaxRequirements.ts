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

        // These supplier accounts require neither an external folio, IVA, nor a
        // complemento by default.
        const noExternalCodeResult = await queryRunner.query(`
            UPDATE accounts
            SET supplier_require_supplement = 0,
                supplier_requires_external_code = 0,
                supplier_requires_tax = 0
            WHERE id IN (
                100, -- Raul Fernando Aznar Ceballos
                59,  -- Nominas Cheques
                56,  -- Banorte
                186, -- AB&C Leasing
                135, -- Control Integral de Combustibles
                313, -- Luis Acosta
                32,  -- Jorge Moller
                375, -- Ix
                387, -- Hector
                328, -- Guillermo Santiago
                299, -- Gastos administrativos
                301, -- Fletes Smurfit
                352, -- Fletes
                297, -- Flete Zamudio
                53,  -- Fidecomiso de energia
                265, -- Fernando Aznar Rivas
                377, -- Fabian (Chiapas)
                363, -- Erick Ambrossi
                362, -- Erasmo Sotelo
                342, -- Duero
                341, -- Diego Partida
                133, -- DESCONOCIDO
                296, -- Caja Chica
                142, -- Angel Zamudio
                340, -- Alfonso Allud
                329, -- Alberto Aznar
                338  -- Alan May
            );
        `);
        this.assertAffectedAccounts(
            noExternalCodeResult,
            27,
            'no-folio, no-tax, and no-supplement exceptions',
        );

        // These Cheques suppliers require both an external folio and IVA, but
        // do not require a complemento.
        const chequeFolioAndTaxResult = await queryRunner.query(`
            UPDATE accounts
            SET supplier_require_supplement = 0,
                supplier_requires_external_code = 1,
                supplier_requires_tax = 1
            WHERE id IN (
                155, -- Mauricio Aznar Rivas - Cheques
                222  -- Fernando Aznar Rivas - Cheques
            );
        `);
        this.assertAffectedAccounts(
            chequeFolioAndTaxResult,
            2,
            'Cheques folio-and-tax exceptions',
        );

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

        // Most clients require a complemento but not a credit note. Normalize
        // those defaults before applying the two hardcoded exception groups.
        await queryRunner.query(`
            UPDATE accounts
            SET client_require_supplement = 1,
                client_require_credit_note = 0
            WHERE is_client = 1;
        `);

        // These three clients require both a complemento and a credit note.
        const creditNoteAndSupplementResult = await queryRunner.query(`
            UPDATE accounts
            SET client_require_supplement = 1,
                client_require_credit_note = 1
            WHERE id IN (
                4,  -- Proveedora del Panadero
                9,  -- Abarrotera del Duero S.A. de C.V.
                11  -- Compañia Mayorista de Abarrotes SA de CV
            );
        `);
        this.assertAffectedAccounts(
            creditNoteAndSupplementResult,
            3,
            'credit-note and supplement exceptions',
        );

        // These client accounts require neither an invoice folio nor IVA by
        // default. They also disable the related supplement, credit-note, and
        // automatic-tax defaults.
        const clientNoInvoiceCodeResult = await queryRunner.query(`
            UPDATE accounts
            SET client_require_credit_note = 0,
                client_require_supplement = 0,
                client_requires_invoice_code = 0,
                client_requires_tax = 0,
                client_automatic_tax_calculation = 0
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
        // tax flag and preserve the folio requirement evidenced by a captured
        // historical invoice code before applying approved account exceptions.
        await queryRunner.query(`
            UPDATE order_sales
            SET require_tax = 1
            WHERE receipt_type_id = 2;
        `);
        await queryRunner.query(`
            UPDATE order_sales
            SET require_invoice_code = 1
            WHERE receipt_type_id = 2
              AND invoice_code <> 0;
        `);
        // Apply every supplier account's three receipt requirements
        // independently to all historical expenses. Non-taxable receipts cannot
        // require an external folio, IVA, or a complemento.
        await queryRunner.query(`
            UPDATE expenses e
            INNER JOIN accounts a ON a.id = e.account_id
            SET e.require_external_code = CASE
                    WHEN e.receipt_type_id = 2 THEN a.supplier_requires_external_code
                    ELSE 0
                END,
                e.require_tax = CASE
                    WHEN e.receipt_type_id = 2 THEN a.supplier_requires_tax
                    ELSE 0
                END,
                e.require_supplement = CASE
                    WHEN e.receipt_type_id = 2 THEN a.supplier_require_supplement
                    ELSE 0
                END
            WHERE a.is_supplier = 1;
        `);

        // Keep historical taxable sales aligned with the approved clients that
        // require neither an invoice folio nor IVA.
        await queryRunner.query(`
            UPDATE order_sales
            SET require_invoice_code = 0,
                require_tax = 0
            WHERE receipt_type_id = 2
              AND account_id IN (
                  100, 87, 56, 189, 264, 265,
                  280, 133, 181, 208, 150
              );
        `);

        // Apply each client account's complemento and credit-note defaults
        // independently to recent historical sales. Non-taxable receipts cannot
        // require either one. Preserve every captured code and amount.
        await queryRunner.query(`
            UPDATE order_sales os
            INNER JOIN accounts a ON a.id = os.account_id
            SET os.require_supplement = CASE
                    WHEN os.receipt_type_id = 2 THEN a.client_require_supplement
                    ELSE 0
                END,
                os.require_credit_note = CASE
                    WHEN os.receipt_type_id = 2 THEN a.client_require_credit_note
                    ELSE 0
                END
            WHERE os.date >= '2026-01-01 00:00:00'
              AND os.date <= NOW()
              AND a.is_client = 1;
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
