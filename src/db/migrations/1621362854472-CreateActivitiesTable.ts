import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivitiesTable1621362854472 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`activities\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`active\`     int       NOT NULL DEFAULT '1',
        \`created_at\` timestamp NULL     DEFAULT NULL,
        \`updated_at\` timestamp NULL     DEFAULT NULL,
        \`user_id\` int unsigned NOT NULL,
        \`description\` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
        \`type\` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
        \`entity_name\` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
        \`entity_id\` int unsigned NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`activities_user_id_foreign\` (\`user_id\`),
        CONSTRAINT \`activities_user_id_foreign\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
