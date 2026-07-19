import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Audit columns (created_by_id / updated_by_id) on the 11 core entities.
 *
 * `order_sales` is the exception: it ALREADY has a MANUAL `created_by_id`
 * ("Generada por" — a business field the user picks), so it gets only
 * `updated_by_id` here. Do not auto-stamp its created_by_id.
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

        // order_sales keeps its existing manual created_by_id untouched.
        await queryRunner.query(`
            ALTER TABLE \`order_sales\`
                ADD COLUMN \`updated_by_id\` int unsigned default null,
                ADD CONSTRAINT \`order_sales_updated_by_id_foreign\` FOREIGN KEY (\`updated_by_id\`)
                    REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
