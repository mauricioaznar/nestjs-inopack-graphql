/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Rebuild the test database from the committed schema snapshot.
 *
 * Why a snapshot exists: the migration chain in `src/db/migrations/` does not
 * build a database from nothing — it starts partway through, on top of a
 * Laravel-era schema. So anything needing a fresh database needs a starting
 * point. `db/schema.sql` is that starting point; see db/README.md for what it
 * contains and how to regenerate it.
 *
 * This script does not transform the file. It drops the database, recreates it,
 * loads the snapshot verbatim, and stops. `db:test:migrate` then runs the
 * standalone runner to apply whatever landed after the snapshot was taken.
 *
 * Usage (always through npm, so env-cmd supplies MYSQL_URL from .env.test):
 *   npm run db:test:reset
 *   npm run db:test:reset -- path/to/other-schema.sql
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DEFAULT_SCHEMA = path.resolve(__dirname, '../db/schema.sql');

function parseUrl(url) {
    const parsed = new URL(url);
    return {
        host: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : 3306,
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        // Leading slash off; query params are Prisma's (pool_timeout,
        // connection_limit), not mysql2's.
        database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
    };
}

async function main() {
    const url = process.env.MYSQL_URL;
    if (!url) {
        throw new Error(
            'MYSQL_URL is not set. Run this through `npm run db:test:reset` so env-cmd loads .env.test.',
        );
    }

    const schemaPath = process.argv[2]
        ? path.resolve(process.argv[2])
        : DEFAULT_SCHEMA;
    if (!fs.existsSync(schemaPath)) {
        throw new Error(
            `Schema snapshot not found: ${schemaPath}\n` +
                'Generate it with the two mysqldump commands in db/README.md.',
        );
    }

    const config = parseUrl(url);

    // This command drops a database. Refuse anything that is not obviously the
    // test one, no matter what MYSQL_URL happens to be pointing at.
    if (!/_test$/.test(config.database)) {
        throw new Error(
            `Refusing to drop "${config.database}" — the database name must end in "_test".`,
        );
    }

    console.log(`schema:   ${schemaPath}`);
    console.log(`database: ${config.database} @ ${config.host}:${config.port}`);

    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Connect without selecting a database so it can be dropped and recreated.
    const { database, ...serverConfig } = config;
    const server = await mysql.createConnection(serverConfig);
    await server.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await server.query(`CREATE DATABASE \`${database}\``);
    await server.end();
    console.log(`recreated ${database}`);

    // One connection for the whole file: mysqldump opens by disabling
    // foreign-key and unique checks and closes by restoring them, and those are
    // session-scoped.
    const db = await mysql.createConnection({
        ...serverConfig,
        database,
        multipleStatements: true,
    });
    await db.query(sql);
    const [tables] = await db.query('SHOW TABLES');
    const [applied] = await db.query(
        'SELECT COUNT(*) AS count FROM `migrations`',
    );
    await db.end();

    console.log(
        `loaded ${tables.length} tables, ${applied[0].count} migrations recorded as applied`,
    );
    console.log(
        '\nNext: npm run db:test:migrate   (applies migrations newer than the snapshot)',
    );
}

main().catch((error) => {
    console.error(`\n${error.message ?? error}`);
    process.exit(1);
});
