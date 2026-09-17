import { MigrationInterface, QueryRunner } from 'typeorm';

// feature/product-computed-names, reduced scope (2026-09-17). The computed-name
// machinery was dropped; this branch now ships only three small changes:
//
//   1. products.description  — DROPPED. It was a legacy mirror of
//      external_description (COUNT(*) WHERE description <> external_description = 0),
//      never exposed in GraphQL, read only by the products default sort. Nothing of
//      value is lost.
//   2. products.internal_description — BLANKED. It becomes the shop-floor shorthand
//      workers refill after this branch ships; the products list gets an "empty
//      internal_description" filter to drive that. The display name already collapses
//      to just external_description when internal is blank
//      (products.resolver.ts compound_description), so no display code changes.
//   3. user_config — NEW table, one row per user, currently only `dark_mode` (lifted
//      out of localStorage). Kept deliberately minimal but present for future
//      per-user settings.
//
// Landing order: timestamped above dev's newest migration (1789300000000) so it
// sorts last and applies on top of a dev-integrated database. Never run against
// production yet, so this timestamp is safe.
//
// TEST-DB SAFETY: `npm run db:test:rebuild` replays this on the empty snapshot. The
// only data statement is an `UPDATE ... ` with no id predicate that matches 0 rows
// on the empty table; everything else is pure DDL. No INSERT with a hardcoded prod
// id, no NOT NULL column added without a default.
export class DropDescriptionBlankInternalAddUserConfig1789400000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`products\` DROP COLUMN \`description\`;
    `);

        // Blank every internal_description. No-op on the empty test DB.
        await queryRunner.query(`
      UPDATE \`products\` SET \`internal_description\` = '';
    `);

        // FK to users has no ON DELETE clause (MySQL RESTRICT), matching
        // refresh_tokens / email_mfa_codes. ⚠️ The Jest teardown in
        // setup-database.ts must delete `user_config` before `users` (added with the
        // Phase 4 Prisma-model changes).
        await queryRunner.query(`
      CREATE TABLE \`user_config\`
      (
          \`id\`         int unsigned NOT NULL AUTO_INCREMENT,
          \`user_id\`    int unsigned NOT NULL,
          \`dark_mode\`  tinyint(1)   NOT NULL DEFAULT '0',
          \`created_at\` datetime     NULL DEFAULT NULL,
          \`updated_at\` datetime     NULL DEFAULT NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`user_config_user_id_unique\` (\`user_id\`),
          CONSTRAINT \`user_config_user_id_foreign\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
      ) ENGINE = InnoDB
        AUTO_INCREMENT = 1
        DEFAULT CHARSET = utf8
        COLLATE = utf8_unicode_ci;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`user_config\`;`);
        // Re-add the dropped column. Its data (and the blanked internal_description)
        // cannot be restored — down() only recovers the schema shape.
        await queryRunner.query(`
      ALTER TABLE \`products\` ADD COLUMN \`description\` varchar(255) NOT NULL DEFAULT '';
    `);
    }
}
