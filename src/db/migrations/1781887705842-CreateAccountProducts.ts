import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountProducts1781887705842 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
          CREATE TABLE \`account_products\`
          (
              \`id\`           int unsigned   NOT NULL AUTO_INCREMENT,
              \`active\`       int            NOT NULL DEFAULT '1',
              \`created_at\`   datetime       NULL     DEFAULT NULL,
              \`updated_at\`   datetime       NULL     DEFAULT NULL,
              \`kilo_price\`   double         NOT NULL DEFAULT '0',
              \`group_price\`  double         NOT NULL DEFAULT '0',
              \`group_weight\` double         NOT NULL DEFAULT '0',
              \`account_id\`   int unsigned   DEFAULT NULL,
              \`product_id\`   int unsigned   DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              KEY \`account_products_account_id_foreign\` (\`account_id\`),
              KEY \`account_products_product_id_foreign\` (\`product_id\`),
              CONSTRAINT \`account_products_account_id_foreign\` FOREIGN KEY (\`account_id\`) REFERENCES \`accounts\` (\`id\`),
              CONSTRAINT \`account_products_product_id_foreign\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`)
          ) ENGINE = InnoDB
            AUTO_INCREMENT = 1
            DEFAULT CHARSET = utf8
            COLLATE = utf8_unicode_ci;
      `,
        );

        // Backfill: one catalog row per (account_id, product_id) from existing active
        // order-request products. For each pair we take the latest line (max id) so the
        // seeded price reflects the most recent request. MySQL 5.7 safe (no window functions).
        await queryRunner.query(`
        INSERT INTO account_products
            (active, created_at, updated_at, account_id, product_id, kilo_price, group_price, group_weight)
        SELECT
            1, NOW(), NOW(),
            src.account_id, src.product_id, src.kilo_price, src.group_price, src.group_weight
        FROM (
            SELECT o.account_id AS account_id,
                   orp.product_id AS product_id,
                   orp.kilo_price AS kilo_price,
                   orp.group_price AS group_price,
                   -- group_weight is a product attribute, derived from the product
                   -- (the catalog re-derives it on every write), not the historical line.
                   p.current_group_weight AS group_weight,
                   orp.id AS id
            FROM order_request_products orp
            INNER JOIN order_requests o ON o.id = orp.order_request_id
            INNER JOIN products p ON p.id = orp.product_id
            WHERE orp.active = 1
              AND o.active = 1
              AND o.account_id IS NOT NULL
              AND orp.product_id IS NOT NULL
        ) src
        INNER JOIN (
            SELECT o2.account_id AS account_id,
                   orp2.product_id AS product_id,
                   MAX(orp2.id) AS max_id
            FROM order_request_products orp2
            INNER JOIN order_requests o2 ON o2.id = orp2.order_request_id
            WHERE orp2.active = 1
              AND o2.active = 1
              AND o2.account_id IS NOT NULL
              AND orp2.product_id IS NOT NULL
            GROUP BY o2.account_id, orp2.product_id
        ) latest
            ON latest.account_id = src.account_id
           AND latest.product_id = src.product_id
           AND latest.max_id = src.id;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`account_products\`;`);
    }
}
