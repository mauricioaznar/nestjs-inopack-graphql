import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Audit columns (created_by_id / updated_by_id) on the 11 core entities.
 *
 * `order_sales` is the exception only in DDL terms: it already had a
 * `created_by_id` column (formerly the manual "Generada por" picker, now
 * repurposed as the auto-stamp), so it needs `updated_by_id` alone here.
 */
export class AddCreatedByAndUpdatedByAuditColumns1784500000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        const bothColumnsTables = [
            'resources',
            'transfers',
            'expenses',
            'accounts',
            'employees',
            'order_requests',
            'machines',
            'products',
            'order_productions',
            'order_adjustments',
        ];

        for (const table of bothColumnsTables) {
            await queryRunner.query(`
                ALTER TABLE \`${table}\`
                    ADD COLUMN \`created_by_id\` int unsigned default null,
                    ADD COLUMN \`updated_by_id\` int unsigned default null,
                    ADD CONSTRAINT \`${table}_created_by_id_foreign\` FOREIGN KEY (\`created_by_id\`)
                        REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
                    ADD CONSTRAINT \`${table}_updated_by_id_foreign\` FOREIGN KEY (\`updated_by_id\`)
                        REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION;
            `);
        }

        // order_sales already has a created_by_id column (added by
        // 1757522259820), so only updated_by_id is new here.
        await queryRunner.query(`
            ALTER TABLE \`order_sales\`
                ADD COLUMN \`updated_by_id\` int unsigned default null,
                ADD CONSTRAINT \`order_sales_updated_by_id_foreign\` FOREIGN KEY (\`updated_by_id\`)
                    REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
