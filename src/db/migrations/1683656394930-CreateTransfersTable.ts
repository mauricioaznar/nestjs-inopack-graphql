import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransfersTable1683656394930 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE \`transfers\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`active\`     int       NOT NULL DEFAULT '1',
        \`created_at\` datetime NULL     DEFAULT NULL,
        \`updated_at\` datetime NULL     DEFAULT NULL,
        \`from_account_id\` int unsigned NULL,
        \`to_account_id\` int unsigned NULL,
        \`expected_date\` datetime DEFAULT NULL,
        \`transferred\` boolean NOT NULL DEFAULT 0,
        \`transferred_date\` datetime DEFAULT NULL,
        \`amount\` double(12 ,2) unsigned NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`transfers_from_account_id_foreign\` (\`from_account_id\`),
        CONSTRAINT \`transfers_from_account_id_foreign\` FOREIGN KEY (\`from_account_id\`) REFERENCES \`clients\` (\`id\`),
        KEY \`transfers_to_account_id_foreign\` (\`to_account_id\`),
        CONSTRAINT \`transfers_to_account_id_foreign\` FOREIGN KEY (\`to_account_id\`) REFERENCES \`clients\` (\`id\`)
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
