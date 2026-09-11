import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRootAndDisabledFlags1789200000000
    implements MigrationInterface
{
    // Two more flags on `users`, plus a one-time data fix for the root account.
    // A separate migration from the Phase 3 one (`AddEmailMfaAndPasswordReset`)
    // for the same reason every migration here is separate once shipped: an
    // applied migration is frozen, so new schema is a new file.
    public async up(queryRunner: QueryRunner): Promise<void> {
        // `is_root` — the protected super-administrator. A root account can only
        // be edited/reset/disabled by itself; no other user (Super included) may
        // touch it. This flag is DELIBERATELY never settable through the app —
        // it is not on any GraphQL input — so the only way to move it is here or
        // directly in MySQL. That is the recovery path: if the root loses access
        // to its email, flip `is_root` onto another account by hand in the
        // database. Enforcement keys off this flag, not off a literal id, so it
        // follows wherever it is moved.
        //
        // `login_disabled` — blocks all future login for the account without
        // deleting it (there is no user-deletion path, and `active = -1`
        // soft-delete would also hide the row from every listing). A disabled
        // account stays visible and manageable in the users panel; it simply
        // cannot authenticate. TINYINT(1) is MySQL's boolean, matching the house
        // convention for the other flag columns on this table.
        await queryRunner.query(`
      ALTER TABLE \`users\`
          ADD COLUMN \`is_root\`         tinyint(1) NOT NULL DEFAULT '0',
          ADD COLUMN \`login_disabled\`  tinyint(1) NOT NULL DEFAULT '0';
    `);

        // Seed the root account: flag it, move its email to the shared
        // administration address, and rename it to a neutral "admin" with no last
        // name (fullname is denormalised, so set it too). The intent is a
        // low-use break-glass account — the human operator keeps a separate,
        // named super-user for day-to-day work. On the `--no-data` test database
        // there is no id=1 row, so this UPDATE touches nothing and the migration
        // still succeeds; on the app and production databases it flips the real
        // account. Scoped to id=1 by deliberate decision — that is the main
        // administrator account.
        await queryRunner.query(`
      UPDATE \`users\`
          SET \`is_root\`     = 1,
              \`email\`       = 'administracion@grupoinopack.com',
              \`first_name\`  = 'admin',
              \`last_name\`   = '',
              \`fullname\`    = 'admin'
          WHERE \`id\` = 1;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Columns only. The data fix (email/name on id=1) is deliberately NOT
        // reverted: the operator intends to reuse the old address
        // (mauricioaznar94@gmail.com) for a *separate* named super-user, so
        // restoring it onto id=1 here would collide on the unique email. A down
        // is a local-dev convenience anyway — this migration runs forward on
        // prod and is never rolled back there.
        await queryRunner.query(`
      ALTER TABLE \`users\`
          DROP COLUMN \`is_root\`,
          DROP COLUMN \`login_disabled\`;
    `);
    }
}
