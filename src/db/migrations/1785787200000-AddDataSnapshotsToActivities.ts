import { MigrationInterface, QueryRunner } from 'typeorm';

// Re-timestamped 2026-08-03 from 1785517054000 (2026-07-31) so this branch's
// migration lands LAST. While it sat unshipped, feature/planning-multiproduct-rows
// was integrated into dev carrying 1785600000000-AddProductionPlanRowProducts —
// a LATER timestamp that is already applied everywhere. The runner sorts by
// filename, so the old number made this file claim a slot in the middle of a
// history that had already moved past it.
//
// The runner identifies a migration by its CLASS NAME, which embeds the
// timestamp, so the class was renamed with the file. On a database where the
// old name already ran, the schema is correct and only the record is stale —
// re-point it rather than reverting anything:
//
//   UPDATE `migrations`
//      SET `name` = 'AddDataSnapshotsToActivities1785787200000',
//          `timestamp` = 1785787200000
//    WHERE `name` = 'AddDataSnapshotsToActivities1785517054000';
//
// A database restored from the dump has never seen either name and simply runs
// this one in its new, correct position.
export class AddDataSnapshotsToActivities1785787200000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Before/after snapshots for the activity audit trail. Both are NULL on
        // rows written before this migration, and stay NULL for every entity we
        // have not wired yet: `old_data` is NULL on a create, `new_data` is NULL
        // on a delete, so the pair also encodes which operation happened.
        //
        // MySQL validates JSON on write, so a malformed payload fails the insert
        // rather than corrupting the column silently.
        await queryRunner.query(`
            ALTER TABLE activities
            ADD COLUMN old_data JSON DEFAULT NULL AFTER entity_id,
            ADD COLUMN new_data JSON DEFAULT NULL AFTER old_data;
        `);

        // The activities table is queried polymorphically (entity_name +
        // entity_id) and had no index on that pair — only on branch_id, role_id
        // and user_id. Nothing needs it today, because the audit dialog looks a
        // row up by primary key, but "show me the history of this sale" is the
        // obvious next request and would full-scan without it.
        //
        // entity_name leads so the index serves both "everything for sale 1042"
        // and "every order-sale activity". Reversed it would only serve the
        // first, and entity_id is never queried alone since ids collide across
        // tables.
        //
        // Deliberately NOT foreign keys: an audit log must not hold referential
        // dependencies on what it audits, or a future hard delete would either
        // be blocked by the constraint or cascade and destroy the trail. The
        // snapshot columns above are what guarantee an activity stays readable
        // after its entity is gone.
        await queryRunner.query(`
            ALTER TABLE activities
            ADD INDEX activities_entity_index (entity_name, entity_id);
        `);

        // `description` held a hand-written sentence per call site, and they had
        // drifted into two different kinds of thing: `Venta: 1042` identifies a
        // record, while `Transferencia: 12` only restated the primary key that
        // `entity_id` already holds. The column now carries a record IDENTIFIER
        // built by activity-title.ts, so the name changes with the meaning —
        // "description" is what invited prose in the first place.
        //
        // Existing rows keep their old values under the new name. No backfill:
        // half the entities they point at are gone, and the old strings are
        // still readable. The feed self-heals as new activities land.
        await queryRunner.query(`
            ALTER TABLE activities
            RENAME COLUMN description TO title;
        `);

        // Serves the date-range filter on the activities page. The list itself
        // still orders by \`id DESC\` — the PK is already ordered and is stable
        // under the constant inserts this table sees.
        await queryRunner.query(`
            ALTER TABLE activities
            ADD INDEX activities_created_at_index (created_at);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE activities
            DROP INDEX activities_created_at_index;
        `);
        await queryRunner.query(`
            ALTER TABLE activities
            RENAME COLUMN title TO description;
        `);
        await queryRunner.query(`
            ALTER TABLE activities
            DROP INDEX activities_entity_index;
        `);
        await queryRunner.query(`
            ALTER TABLE activities
            DROP COLUMN new_data,
            DROP COLUMN old_data;
        `);
    }
}
