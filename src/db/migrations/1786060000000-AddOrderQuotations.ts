import { MigrationInterface, QueryRunner } from 'typeorm';

// Cotizaciones (order quotations): a quotation document that PRECEDES a pedido.
// Accepting one (admin-only) writes the client's price catalog and creates the
// order_request. See docs/plans/ongoing/feature-order-quotations.md.
//
// Three NEW tables, one existing table touched. The lines and most of the header
// mirror order_requests, but a cotización deliberately is NOT an order_request:
// order_requests is wired into production planning (priority, "Pedidos por
// surtir", coverage) and a cotización must never appear there. It also allows a
// FREE LINE (product_id NULL + proposed_description) and FREE PRICES — both of
// which order_requests validation exists to forbid.
//
// Order inside up() is load-bearing: order_quotations must exist before the
// ALTER TABLE order_requests that references it, and down() drops the FK and
// column BEFORE dropping the tables.
export class AddOrderQuotations1786060000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Statuses — mirrors order_request_statuses (id, active, name, stamps).
        await queryRunner.query(`
            CREATE TABLE \`order_quotation_statuses\`
            (
                \`id\`         int unsigned NOT NULL AUTO_INCREMENT,
                \`active\`     int          NOT NULL DEFAULT '1',
                \`name\`       varchar(255) NOT NULL,
                \`created_at\` datetime              DEFAULT NULL,
                \`updated_at\` datetime              DEFAULT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
              AUTO_INCREMENT = 1
              DEFAULT CHARSET = utf8
              COLLATE = utf8_unicode_ci;
        `);

        // A fresh AUTO_INCREMENT hands out 1..4 in order, so the ids match the
        // plan's mapping: 1 Borrador, 2 Enviada, 3 Aceptada, 4 Rechazada.
        // "Vencida" is NOT a status — it is expiration_date < today, derived on
        // read, so it needs no cron to stay true.
        await queryRunner.query(`
            INSERT INTO \`order_quotation_statuses\` (\`name\`, \`created_at\`, \`updated_at\`) VALUES
                ('Borrador',  NOW(), NOW()),
                ('Enviada',   NOW(), NOW()),
                ('Aceptada',  NOW(), NOW()),
                ('Rechazada', NOW(), NOW());
        `);

        // 2. order_quotations — order_requests MINUS priority, PLUS four columns.
        //    Amounts (subtotal/tax/total) are DERIVED on read, never stored: a
        //    cotización is not a comprobante and must not carry frozen money
        //    columns that can drift from its lines.
        await queryRunner.query(`
            CREATE TABLE \`order_quotations\`
            (
                \`id\`                          int unsigned NOT NULL AUTO_INCREMENT,
                \`order_code\`                  int          NOT NULL,
                \`active\`                      int          NOT NULL DEFAULT '1',
                \`date\`                        datetime     NOT NULL,
                \`created_at\`                  datetime              DEFAULT NULL,
                \`updated_at\`                  datetime              DEFAULT NULL,
                \`account_id\`                  int unsigned          DEFAULT NULL,
                \`order_quotation_status_id\`   int unsigned          DEFAULT NULL,
                \`estimated_delivery_date\`     datetime              DEFAULT NULL,
                \`notes\`                       varchar(255) NOT NULL,
                -- vigencia; NULL = sin vencimiento
                \`expiration_date\`             datetime              DEFAULT NULL,
                -- condiciones de pago, texto libre
                \`payment_terms\`               varchar(255) NOT NULL DEFAULT '',
                -- IVA visible en el documento (16% cuando 1, 0% cuando 0)
                \`require_tax\`                  tinyint(1)   NOT NULL DEFAULT '0',
                -- cuándo esta cotización escribió el catálogo; NULL = todavía no.
                -- STORED on purpose: it records that a one-time destructive write
                -- happened, and must never be re-inferred from a catalog others
                -- can edit. See the plan, "One stored column, two derived".
                \`account_products_updated_at\` datetime              DEFAULT NULL,
                \`created_by_id\`               int unsigned          DEFAULT NULL,
                \`updated_by_id\`               int unsigned          DEFAULT NULL,
                PRIMARY KEY (\`id\`),
                KEY \`order_quotations_account_id_foreign\` (\`account_id\`),
                KEY \`order_quotations_order_quotation_status_id_foreign\` (\`order_quotation_status_id\`),
                KEY \`order_quotations_created_by_id_foreign\` (\`created_by_id\`),
                KEY \`order_quotations_updated_by_id_foreign\` (\`updated_by_id\`),
                CONSTRAINT \`order_quotations_account_id_foreign\` FOREIGN KEY (\`account_id\`) REFERENCES \`accounts\` (\`id\`),
                CONSTRAINT \`order_quotations_order_quotation_status_id_foreign\` FOREIGN KEY (\`order_quotation_status_id\`) REFERENCES \`order_quotation_statuses\` (\`id\`),
                CONSTRAINT \`order_quotations_created_by_id_foreign\` FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\` (\`id\`),
                CONSTRAINT \`order_quotations_updated_by_id_foreign\` FOREIGN KEY (\`updated_by_id\`) REFERENCES \`users\` (\`id\`)
            ) ENGINE = InnoDB
              AUTO_INCREMENT = 1
              DEFAULT CHARSET = utf8
              COLLATE = utf8_unicode_ci;
        `);

        // 3. order_quotation_products — a copy of order_request_products PLUS
        //    proposed_description. product_id is NULLABLE and genuinely allowed
        //    to be NULL here (the one place in the system): a free line names a
        //    specification that does not exist yet, and renders as its
        //    proposed_description rather than a product's external_description.
        await queryRunner.query(`
            CREATE TABLE \`order_quotation_products\`
            (
                \`id\`                   int unsigned NOT NULL AUTO_INCREMENT,
                \`active\`               int          NOT NULL DEFAULT '1',
                \`created_at\`           datetime              DEFAULT NULL,
                \`updated_at\`           datetime              DEFAULT NULL,
                \`kilos\`                double       NOT NULL,
                \`groups\`               double       NOT NULL DEFAULT '0',
                \`kilo_price\`           double       NOT NULL,
                \`group_price\`          double       NOT NULL DEFAULT '0',
                \`group_weight\`         double       NOT NULL DEFAULT '0',
                -- '' por defecto; se usa cuando product_id es NULL (línea libre)
                \`proposed_description\` varchar(255) NOT NULL DEFAULT '',
                \`product_id\`           int unsigned          DEFAULT NULL,
                \`order_quotation_id\`   int unsigned          DEFAULT NULL,
                PRIMARY KEY (\`id\`),
                KEY \`order_quotation_products_order_quotation_id_foreign\` (\`order_quotation_id\`),
                KEY \`order_quotation_products_product_id_foreign\` (\`product_id\`),
                CONSTRAINT \`order_quotation_products_order_quotation_id_foreign\` FOREIGN KEY (\`order_quotation_id\`) REFERENCES \`order_quotations\` (\`id\`),
                CONSTRAINT \`order_quotation_products_product_id_foreign\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`)
            ) ENGINE = InnoDB
              AUTO_INCREMENT = 1
              DEFAULT CHARSET = utf8
              COLLATE = utf8_unicode_ci;
        `);

        // 4. Conversion link on order_requests — the ONLY change to an existing
        //    table. The later document (the pedido) points back at the earlier
        //    one (the cotización), mirroring order_sales.order_request_id.
        //
        //    UNIQUE, unlike its precedent: order_sales.order_request_id is not
        //    unique (one pedido -> many ventas), but a cotización produces AT
        //    MOST ONE pedido, so this is a database invariant. MySQL permits many
        //    NULLs in a unique index, so every existing order_requests row gets
        //    NULL and none collide.
        await queryRunner.query(`
            ALTER TABLE \`order_requests\`
                ADD COLUMN \`order_quotation_id\` int unsigned DEFAULT NULL,
                ADD UNIQUE KEY \`order_requests_order_quotation_id_unique\` (\`order_quotation_id\`),
                ADD CONSTRAINT \`order_requests_order_quotation_id_foreign\`
                    FOREIGN KEY (\`order_quotation_id\`)
                    REFERENCES \`order_quotations\` (\`id\`)
                    ON DELETE NO ACTION ON UPDATE NO ACTION;
        `);

        // 5. rfc + address on accounts — GENERAL account columns (no client_
        //    prefix): an account has one RFC and one address regardless of whether
        //    it is a client, a supplier, or both. They surface in the account
        //    form's General tab and print in the cotización's DATOS DEL CLIENTE
        //    block (empty renders as "No proporcionado"). Plain scalar columns:
        //    NOT NULL DEFAULT '' like name/abbreviation/payment_terms, so every
        //    existing row backfills to '' and no code path has to handle NULL.
        //    Folded into this feature's single migration per the in-place rule;
        //    they are independent of the quotation tables above.
        await queryRunner.query(`
            ALTER TABLE \`accounts\`
                ADD COLUMN \`rfc\`     varchar(255) NOT NULL DEFAULT '',
                ADD COLUMN \`address\` varchar(255) NOT NULL DEFAULT '';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse order: drop the FK and column on order_requests BEFORE dropping
        // the tables they reference, or the FK drop fails.
        await queryRunner.query(`
            ALTER TABLE \`accounts\`
                DROP COLUMN \`rfc\`,
                DROP COLUMN \`address\`;
        `);

        await queryRunner.query(`
            ALTER TABLE \`order_requests\`
                DROP FOREIGN KEY \`order_requests_order_quotation_id_foreign\`,
                DROP KEY \`order_requests_order_quotation_id_unique\`,
                DROP COLUMN \`order_quotation_id\`;
        `);

        await queryRunner.query(
            `DROP TABLE IF EXISTS \`order_quotation_products\`;`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS \`order_quotations\`;`);
        await queryRunner.query(
            `DROP TABLE IF EXISTS \`order_quotation_statuses\`;`,
        );
    }
}
