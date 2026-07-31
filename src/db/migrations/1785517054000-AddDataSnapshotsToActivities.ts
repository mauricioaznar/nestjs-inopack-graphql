import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataSnapshotsToActivities1785517054000
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
