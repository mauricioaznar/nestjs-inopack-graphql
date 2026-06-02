import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpenseStatuses1747353600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`expense_statuses\` (
                \`id\`         int unsigned NOT NULL AUTO_INCREMENT,
                \`active\`     int          NOT NULL DEFAULT '1',
                \`name\`       varchar(255) NOT NULL,
                \`color\`      varchar(7)            DEFAULT NULL,
                \`created_at\` datetime              DEFAULT NULL,
                \`updated_at\` datetime              DEFAULT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
        `);

        await queryRunner.query(`
            INSERT INTO \`expense_statuses\` (\`name\`, \`color\`) VALUES
                ('En revision', '#FFA726'),
                ('Conciliado',  '#42A5F5'),
                ('Autorizado',  '#66BB6A'),
                ('No pagar',    '#EF5350');
        `);

        await queryRunner.query(`
            ALTER TABLE \`expenses\`
                ADD COLUMN \`expense_status_id\` int unsigned DEFAULT NULL,
                ADD CONSTRAINT \`expenses_expense_status_id_foreign\`
                    FOREIGN KEY (\`expense_status_id\`)
                    REFERENCES \`expense_statuses\` (\`id\`)
                    ON DELETE NO ACTION ON UPDATE NO ACTION;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`expenses\`
                DROP FOREIGN KEY \`expenses_expense_status_id_foreign\`,
                DROP COLUMN \`expense_status_id\`;
        `);

        await queryRunner.query(`DROP TABLE \`expense_statuses\`;`);
    }
}
