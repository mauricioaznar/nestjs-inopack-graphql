import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Comment + pending-document tracking for sales and expenses.
 *
 * Two parallel tables rather than a polymorphic pattern — the codebase has no
 * polymorphic relations, so each comment table owns a plain FK to its parent
 * (`order_sale_id` / `expense_id`). Both mirror the shape used elsewhere:
 * `active` soft-delete flag, nullable `created_at` / `updated_at`, and a
 * `created_by_id` audit stamp FK to `users` (the same relation pattern already
 * on `order_sales` / `expenses`).
 *
 * `requires_pending_document` gates `pending_document_delivered` and
 * `document_name`; the second checkbox is only meaningful when the first is on.
 */
export class CreateSaleAndExpenseComments1786046400000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`order_sale_comments\`
            (
                \`id\`                        int unsigned NOT NULL AUTO_INCREMENT,
                \`active\`                    int          NOT NULL DEFAULT '1',
                \`created_at\`                datetime     NULL     DEFAULT NULL,
                \`updated_at\`                datetime     NULL     DEFAULT NULL,
                \`body\`                      text         NOT NULL,
                \`order_sale_id\`             int unsigned NULL     DEFAULT NULL,
                \`created_by_id\`             int unsigned NULL     DEFAULT NULL,
                \`requires_pending_document\` tinyint(1)   NOT NULL DEFAULT '0',
                \`pending_document_delivered\` tinyint(1)  NOT NULL DEFAULT '0',
                \`document_name\`             varchar(255) NOT NULL DEFAULT '',
                PRIMARY KEY (\`id\`),
                KEY \`order_sale_comments_order_sale_id_foreign\` (\`order_sale_id\`),
                KEY \`order_sale_comments_created_by_id_foreign\` (\`created_by_id\`),
                CONSTRAINT \`order_sale_comments_order_sale_id_foreign\`
                    FOREIGN KEY (\`order_sale_id\`) REFERENCES \`order_sales\` (\`id\`)
                    ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`order_sale_comments_created_by_id_foreign\`
                    FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\` (\`id\`)
                    ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE = InnoDB
              AUTO_INCREMENT = 1
              DEFAULT CHARSET = utf8
              COLLATE = utf8_unicode_ci;
        `);

        await queryRunner.query(`
            CREATE TABLE \`expense_comments\`
            (
                \`id\`                        int unsigned NOT NULL AUTO_INCREMENT,
                \`active\`                    int          NOT NULL DEFAULT '1',
                \`created_at\`                datetime     NULL     DEFAULT NULL,
                \`updated_at\`                datetime     NULL     DEFAULT NULL,
                \`body\`                      text         NOT NULL,
                \`expense_id\`                int unsigned NULL     DEFAULT NULL,
                \`created_by_id\`             int unsigned NULL     DEFAULT NULL,
                \`requires_pending_document\` tinyint(1)   NOT NULL DEFAULT '0',
                \`pending_document_delivered\` tinyint(1)  NOT NULL DEFAULT '0',
                \`document_name\`             varchar(255) NOT NULL DEFAULT '',
                PRIMARY KEY (\`id\`),
                KEY \`expense_comments_expense_id_foreign\` (\`expense_id\`),
                KEY \`expense_comments_created_by_id_foreign\` (\`created_by_id\`),
                CONSTRAINT \`expense_comments_expense_id_foreign\`
                    FOREIGN KEY (\`expense_id\`) REFERENCES \`expenses\` (\`id\`)
                    ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT \`expense_comments_created_by_id_foreign\`
                    FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\` (\`id\`)
                    ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE = InnoDB
              AUTO_INCREMENT = 1
              DEFAULT CHARSET = utf8
              COLLATE = utf8_unicode_ci;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP TABLE IF EXISTS \`order_sale_comments\`;`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS \`expense_comments\`;`);
    }
}
