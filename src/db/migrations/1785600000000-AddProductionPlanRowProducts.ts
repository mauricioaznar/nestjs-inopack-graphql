import { MigrationInterface, QueryRunner } from 'typeorm';

// Planeación: a row (one machine) may now carry SEVERAL products, each consuming
// an explicit number of hours out of the plan's shift. Two schema moves:
//
//   1. `production_plans.shift_hours` — "Horas" used to be a display-only knob in
//      the React page. The rule "a row's products must sum to the shift" cannot be
//      validated server-side unless the server knows the shift length, so it
//      becomes plan data.
//   2. `production_plan_row_products` — replaces the single
//      `production_plan_rows.product_id`, adding `hours` and an optional link to
//      the order request the planned product is meant to serve.
//
// The old column is backfilled and dropped rather than kept as a "primary
// product": two sources of truth for the same fact is exactly how the
// products-to-produce `groups_*` accumulation bug happened.
export class AddProductionPlanRowProducts1785600000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
          ALTER TABLE \`production_plans\`
            ADD COLUMN \`shift_hours\` double NOT NULL DEFAULT 8 AFTER \`shift\`;
      `,
        );

        await queryRunner.query(
            `
          CREATE TABLE \`production_plan_row_products\`
          (
              \`id\`                     int unsigned NOT NULL AUTO_INCREMENT,
              \`active\`                 int          NOT NULL DEFAULT '1',
              \`created_at\`             datetime     NULL     DEFAULT NULL,
              \`updated_at\`             datetime     NULL     DEFAULT NULL,
              \`production_plan_row_id\` int unsigned          DEFAULT NULL,
              \`product_id\`             int unsigned          DEFAULT NULL,
              \`hours\`                  double       NOT NULL DEFAULT 0,
              \`order_request_id\`       int unsigned          DEFAULT NULL,
              \`position\`               int          NOT NULL DEFAULT '0',
              PRIMARY KEY (\`id\`),
              KEY \`ppr_products_row_id_foreign\` (\`production_plan_row_id\`),
              KEY \`ppr_products_product_id_foreign\` (\`product_id\`),
              KEY \`ppr_products_order_request_id_fk\` (\`order_request_id\`),
              CONSTRAINT \`ppr_products_row_id_foreign\` FOREIGN KEY (\`production_plan_row_id\`) REFERENCES \`production_plan_rows\` (\`id\`),
              CONSTRAINT \`ppr_products_product_id_foreign\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`),
              CONSTRAINT \`ppr_products_order_request_id_fk\` FOREIGN KEY (\`order_request_id\`) REFERENCES \`order_requests\` (\`id\`)
          ) ENGINE = InnoDB
            AUTO_INCREMENT = 1
            DEFAULT CHARSET = utf8
            COLLATE = utf8_unicode_ci;
      `,
        );

        // Backfill every saved single-product row. hours = the plan's shift_hours
        // (8 for every pre-existing plan, per the column default above), so each
        // migrated row already satisfies the "products sum to the shift" rule and
        // no historical plan becomes unsaveable. Rows with no product produce
        // nothing and are deliberately skipped — they stay exempt from the rule.
        await queryRunner.query(
            `
          INSERT INTO \`production_plan_row_products\`
            (\`active\`, \`created_at\`, \`updated_at\`, \`production_plan_row_id\`, \`product_id\`, \`hours\`, \`position\`)
          SELECT 1, NOW(), NOW(), r.\`id\`, r.\`product_id\`, p.\`shift_hours\`, 0
          FROM \`production_plan_rows\` r
          JOIN \`production_plans\` p ON p.\`id\` = r.\`production_plan_id\`
          WHERE r.\`product_id\` IS NOT NULL
            AND r.\`active\` = 1;
      `,
        );

        await queryRunner.query(
            `
          ALTER TABLE \`production_plan_rows\`
            DROP FOREIGN KEY \`production_plan_rows_product_id_foreign\`;
      `,
        );

        await queryRunner.query(
            `
          ALTER TABLE \`production_plan_rows\`
            DROP COLUMN \`product_id\`;
      `,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
          ALTER TABLE \`production_plan_rows\`
            ADD COLUMN \`product_id\` int unsigned DEFAULT NULL AFTER \`machine_id\`;
      `,
        );

        await queryRunner.query(
            `
          ALTER TABLE \`production_plan_rows\`
            ADD CONSTRAINT \`production_plan_rows_product_id_foreign\`
            FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`);
      `,
        );

        // Lossy by nature: a row that gained several products can only give one
        // back. Restore the lowest-position product so the column is at least
        // coherent; the hours and the order-request links are gone.
        await queryRunner.query(
            `
          UPDATE \`production_plan_rows\` r
          SET r.\`product_id\` = (
            SELECT rp.\`product_id\`
            FROM \`production_plan_row_products\` rp
            WHERE rp.\`production_plan_row_id\` = r.\`id\`
              AND rp.\`active\` = 1
            ORDER BY rp.\`position\` ASC, rp.\`id\` ASC
            LIMIT 1
          );
      `,
        );

        await queryRunner.query(
            `DROP TABLE IF EXISTS \`production_plan_row_products\`;`,
        );

        await queryRunner.query(
            `ALTER TABLE \`production_plans\` DROP COLUMN \`shift_hours\`;`,
        );
    }
}
