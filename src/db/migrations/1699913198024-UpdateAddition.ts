import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAddition1699913198024 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`expense_raw_material_additions\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`active\`     int       NOT NULL DEFAULT '1',
        \`created_at\` datetime NULL     DEFAULT NULL,
        \`updated_at\` datetime NULL     DEFAULT NULL,
        \`amount\` double(12 ,2) unsigned NOT NULL,
        \`expense_id\` int unsigned NULL,
        \`raw_material_addition_id\` int unsigned NULL,
        PRIMARY KEY (\`id\`),
        KEY \`erma_expense_id_foreign\` (\`expense_id\`),
        CONSTRAINT \`erma_expense_id_foreign\` FOREIGN KEY (\`expense_id\`) REFERENCES \`expenses\` (\`id\`),
        KEY \`erma_raw_material_addition_id_foreign\` (\`raw_material_addition_id\`),
        CONSTRAINT \`erma_raw_material_addition_id_foreign\` FOREIGN KEY (\`raw_material_addition_id\`) REFERENCES \`raw_material_additions\` (\`id\`)
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
    `);

    await queryRunner.query(
      'ALTER TABLE machines ADD `discontinued` boolean not null default 0',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
