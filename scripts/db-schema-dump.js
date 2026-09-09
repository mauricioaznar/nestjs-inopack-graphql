/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Regenerate `db/schema.sql` — the committed schema snapshot.
 *
 * See db/README.md for what the snapshot is and why it is committed. This script
 * only automates the recipe documented there; it applies no transformation of
 * its own, it just calls `mysql` / `mysqldump` with the right flags.
 *
 * What it does:
 *   1. Restores the production dump into a throwaway database.
 *   2. Dumps it back out twice: schema with no rows, then the `migrations`
 *      table's rows appended.
 *   3. Drops the throwaway.
 *
 * Sourcing from the production dump rather than the working `inopack` database
 * is deliberate — that is the one database nobody rebuilds, so its drift would
 * become the committed baseline.
 *
 * Usage:
 *   npm run db:schema:dump
 *   npm run db:schema:dump -- path/to/other-dump.sql
 *
 * Overrides:
 *   MYSQL_BIN_DIR   directory holding mysql/mysqldump, if not on PATH and not
 *                   discoverable under Program Files
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRATCH_DB = 'inopack_schema_src';
const DEFAULT_DUMP = path.resolve(__dirname, '../../inopack.sql');
const OUTPUT = path.resolve(__dirname, '../db/schema.sql');

// Windows installs land in "C:\Program Files\MySQL\MySQL Server <version>\bin".
// Version is part of the path, so it must never be hardcoded.
const WINDOWS_MYSQL_ROOT = 'C:\\Program Files\\MySQL';

function onPath(name) {
    const probe = spawnSync(name, ['--version'], { stdio: 'ignore' });
    return probe.status === 0;
}

function discoverWindowsBinDir() {
    if (!fs.existsSync(WINDOWS_MYSQL_ROOT)) return null;
    const candidates = fs
        .readdirSync(WINDOWS_MYSQL_ROOT)
        .filter((entry) => /^MySQL Server /.test(entry))
        .map((entry) => path.join(WINDOWS_MYSQL_ROOT, entry, 'bin'))
        .filter((dir) => fs.existsSync(path.join(dir, 'mysqldump.exe')))
        // Highest version wins: "MySQL Server 9.6" over "MySQL Server 8.1".
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    return candidates[0] ?? null;
}

function resolveBinaries() {
    const override = process.env.MYSQL_BIN_DIR;
    if (override) {
        return {
            mysql: path.join(override, 'mysql'),
            mysqldump: path.join(override, 'mysqldump'),
            from: override,
        };
    }
    if (onPath('mysqldump')) {
        return { mysql: 'mysql', mysqldump: 'mysqldump', from: 'PATH' };
    }
    const discovered = discoverWindowsBinDir();
    if (discovered) {
        return {
            mysql: path.join(discovered, 'mysql'),
            mysqldump: path.join(discovered, 'mysqldump'),
            from: discovered,
        };
    }
    throw new Error(
        'Could not find mysql/mysqldump. Put them on PATH, or set MYSQL_BIN_DIR to the directory containing them.',
    );
}

function parseUrl(url) {
    const parsed = new URL(url);
    return {
        host: parsed.hostname,
        port: parsed.port || '3306',
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
    };
}

function run(command, args, { stdin, stdout } = {}) {
    const result = spawnSync(command, args, {
        // The password travels in MYSQL_PWD (set in main), never on the command
        // line — no "Using a password on the command line interface can be
        // insecure" warning, and it stays out of the process list.
        stdio: [stdin ?? 'ignore', stdout ?? 'inherit', 'inherit'],
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(`${path.basename(command)} exited with ${result.status}`);
    }
}

function main() {
    const dumpPath = process.argv[2]
        ? path.resolve(process.argv[2])
        : DEFAULT_DUMP;
    if (!fs.existsSync(dumpPath)) {
        throw new Error(`Source dump not found: ${dumpPath}`);
    }

    const url = process.env.MYSQL_URL;
    if (!url) {
        throw new Error(
            'MYSQL_URL is not set. Run this through `npm run db:schema:dump` so env-cmd loads .env.',
        );
    }
    const db = parseUrl(url);
    process.env.MYSQL_PWD = db.password;

    const bin = resolveBinaries();
    const connect = ['-h', db.host, '-P', db.port, '-u', db.user];

    console.log(`binaries: ${bin.from}`);
    console.log(`source:   ${dumpPath}`);
    console.log(`output:   ${OUTPUT}`);

    console.log(`\nrestoring into ${SCRATCH_DB} (this takes a minute)...`);
    run(bin.mysql, [
        ...connect,
        '-e',
        `DROP DATABASE IF EXISTS \`${SCRATCH_DB}\`; CREATE DATABASE \`${SCRATCH_DB}\`;`,
    ]);
    const dumpFd = fs.openSync(dumpPath, 'r');
    run(bin.mysql, [...connect, SCRATCH_DB], { stdin: dumpFd });
    fs.closeSync(dumpFd);

    // Pass 1: every table, no rows.
    console.log('dumping schema...');
    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    const out = fs.openSync(OUTPUT, 'w');
    run(
        bin.mysqldump,
        [
            ...connect,
            '--no-data',
            '--skip-dump-date',
            '--no-tablespaces',
            SCRATCH_DB,
        ],
        { stdout: out },
    );
    fs.closeSync(out);

    // Pass 2: the runner's bookkeeping rows, appended. Without these the runner
    // sees an empty `migrations` table and replays every migration onto a schema
    // that already has them. One row per line so the file diffs readably.
    console.log('appending migrations rows...');
    const append = fs.openSync(OUTPUT, 'a');
    run(
        bin.mysqldump,
        [
            ...connect,
            '--no-create-info',
            '--skip-extended-insert',
            '--skip-dump-date',
            '--no-tablespaces',
            SCRATCH_DB,
            'migrations',
        ],
        { stdout: append },
    );
    fs.closeSync(append);

    run(bin.mysql, [
        ...connect,
        '-e',
        `DROP DATABASE \`${SCRATCH_DB}\`;`,
    ]);

    const contents = fs.readFileSync(OUTPUT, 'utf8');
    const tables = (contents.match(/^CREATE TABLE /gm) || []).length;
    const rows = (contents.match(/^INSERT INTO /gm) || []).length;
    console.log(
        `\ndone: ${tables} tables, ${rows} migrations recorded (${Math.round(contents.length / 1024)} KB)`,
    );
    console.log('Review the diff, then commit db/schema.sql.');
}

try {
    main();
} catch (error) {
    console.error(`\n${error.message ?? error}`);
    process.exit(1);
}
