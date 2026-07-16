import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountResources1784073600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
          CREATE TABLE \`account_resources\`
          (
              \`id\`          int unsigned   NOT NULL AUTO_INCREMENT,
              \`active\`      int            NOT NULL DEFAULT '1',
              \`created_at\`  datetime       NULL     DEFAULT NULL,
              \`updated_at\`  datetime       NULL     DEFAULT NULL,
              \`unit_price\`  double         NOT NULL DEFAULT '0',
              \`notes\`       varchar(255)   NOT NULL DEFAULT '',
              \`account_id\`  int unsigned   DEFAULT NULL,
              \`resource_id\` int unsigned   DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              KEY \`account_resources_account_id_foreign\` (\`account_id\`),
              KEY \`account_resources_resource_id_foreign\` (\`resource_id\`),
              CONSTRAINT \`account_resources_account_id_foreign\` FOREIGN KEY (\`account_id\`) REFERENCES \`accounts\` (\`id\`),
              CONSTRAINT \`account_resources_resource_id_foreign\` FOREIGN KEY (\`resource_id\`) REFERENCES \`resources\` (\`id\`)
          ) ENGINE = InnoDB
            AUTO_INCREMENT = 1
            DEFAULT CHARSET = utf8
            COLLATE = utf8_unicode_ci;
      `,
        );

        // Backfill: seed the supplier catalog from the PREVIOUS calendar month's
        // expense lines. For every active expense_resources line whose parent
        // expense is active, has an account_id and a non-null resource_id, and
        // whose expenses.date falls in the previous calendar month (relative to
        // NOW() at migration time), insert one catalog row copying the line's
        // notes and unit_price (null unit_price → 0). NO dedup — recurring monthly
        // supplier expenses intentionally become repeated guideline rows.
        // MySQL 5.7 safe (no window functions).
        await queryRunner.query(`
        INSERT INTO account_resources
            (active, created_at, updated_at, account_id, resource_id, unit_price, notes)
        SELECT
            1, NOW(), NOW(),
            e.account_id,
            er.resource_id,
            IFNULL(er.unit_price, 0),
            er.notes
        FROM expense_resources er
        INNER JOIN expenses e ON e.id = er.expense_id
        WHERE er.active = 1
          AND e.active = 1
          AND e.account_id IS NOT NULL
          AND er.resource_id IS NOT NULL
          AND e.date >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
          AND e.date < DATE_FORMAT(NOW(), '%Y-%m-01');
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`account_resources\`;`);
    }
}
