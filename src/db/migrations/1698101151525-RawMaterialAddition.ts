import { MigrationInterface, QueryRunner } from 'typeorm';

export class RawMaterialAddition1698101151525 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE \`raw_material_additions\` (
            \`id\` int unsigned NOT NULL AUTO_INCREMENT,
            \`active\`     int       NOT NULL DEFAULT '1',
            \`created_at\` datetime NULL     DEFAULT NULL,
            \`updated_at\` datetime NULL     DEFAULT NULL,
            \`account_id\` int unsigned NULL,
            \`date\` datetime DEFAULT NULL,
            PRIMARY KEY (\`id\`),
            KEY \`raw_material_addition_account_id_foreign\` (\`account_id\`),
            CONSTRAINT \`raw_material_addition_account_id_foreign\` FOREIGN KEY (\`account_id\`) REFERENCES \`accounts\` (\`id\`)
          ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE \`raw_material_addition_items\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`active\`     int       NOT NULL DEFAULT '1',
        \`amount\` double(12 ,2) unsigned NOT NULL,
        \`unit_price\` double(12 ,2) unsigned NOT NULL,
        \`created_at\` datetime NULL     DEFAULT NULL,
        \`updated_at\` datetime NULL     DEFAULT NULL,
        \`raw_material_addition_id\` int unsigned NULL,
        \`resource_id\` int unsigned NULL,
        PRIMARY KEY (\`id\`),
        KEY \`raw_material_addition_item_addition_id_foreign\` (\`raw_material_addition_id\`),
        CONSTRAINT \`raw_material_addition_item_addition_id_foreign\` FOREIGN KEY (\`raw_material_addition_id\`) REFERENCES \`raw_material_additions\` (\`id\`),
        KEY \`raw_material_addition_item_resource_id_foreign\` (\`resource_id\`),
        CONSTRAINT \`raw_material_addition_item_resource_id_foreign\` FOREIGN KEY (\`resource_id\`) REFERENCES \`resources\` (\`id\`)
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
