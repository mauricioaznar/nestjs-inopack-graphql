import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExpensesTables1684776541931 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE \`expenses\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`active\`     int       NOT NULL DEFAULT '1',
        \`created_at\` datetime NULL     DEFAULT NULL,
        \`updated_at\` datetime NULL     DEFAULT NULL,
        \`date\` datetime DEFAULT NULL,
        \`expected_payment_date\` datetime DEFAULT NULL,
        \`locked\` boolean NOT NULL DEFAULT 0,
        \`order_code\` varchar(255) NOT NULL default '',
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
    `);

        await queryRunner.query(`
      CREATE TABLE \`expense_resources\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`active\`     int       NOT NULL DEFAULT '1',
        \`created_at\` datetime NULL     DEFAULT NULL,
        \`updated_at\` datetime NULL     DEFAULT NULL,
        \`amount\` double(12 ,2) unsigned NOT NULL,
        \`expense_id\` int unsigned NULL,
        PRIMARY KEY (\`id\`),
        KEY \`expense_resources_expense_id_foreign\` (\`expense_id\`),
        CONSTRAINT \`expense_resources_expense_id_foreign\` FOREIGN KEY (\`expense_id\`) REFERENCES \`expenses\` (\`id\`)
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
