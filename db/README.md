# `db/schema.sql` — the schema snapshot

## What it is

The starting point for building a database that has no history.

The 109 raw-SQL migrations in [`src/db/migrations/`](../src/db/migrations) do
**not** build a database from nothing — the chain begins partway through, on top
of a Laravel-era schema that predates it. So a fresh database (the test database,
a new machine, CI) needs a baseline from somewhere, and that is this file.

It contains two things:

1. Every table definition, with **no rows**.
2. The rows of the `migrations` table — the runner's bookkeeping.

Part 2 is not optional. The runner
([`src/db/runner.ts`](../src/db/runner.ts)) decides what to apply by comparing
migration class names against that table. Load the schema without those rows and
the runner concludes nothing has ever run, then replays all 109 migrations
against a schema that already has every one of them applied.

Everything after the snapshot is handled by the runner, so this file is allowed
to fall behind. A stale snapshot costs a few seconds on rebuild, not correctness.

## Why it is committed, when `inopack.sql` is not

`inopack.sql` is excluded from version control because it is real business data —
clients, sales, expenses, payroll, password hashes.

`--no-data` removes all of it. What remains is table definitions plus a list of
migration names and timestamps: nothing sensitive, a few hundred KB. The reason
to keep the data dump out of git does not apply here.

Committing it also makes the schema **reviewable**. Nothing else in version
control describes what the database looks like — `prisma/schema.prisma` is
gitignored and the migrations only record what *changed*, never what *is*. With
this file tracked, a migration's effect on the schema appears as a diff in the
pull request that introduces it.

## Regenerating it

Source the snapshot from **production**, not from your working `inopack`
database — that is the one database nobody rebuilds, so its drift would become
the committed baseline. Production's schema lags, which is fine and slightly
useful: the runner then replays everything merged since, on every rebuild.

You do not need server access. `inopack.sql` in the umbrella root is already a
production dump, so restore it into a throwaway database and dump out of that.

```bash
npm run db:schema:dump
```

That is the whole thing. It restores the dump into a throwaway database, takes
the two passes below out of it, drops the throwaway, and reports what it wrote.
Review the diff and commit `db/schema.sql`.

It finds `mysql` / `mysqldump` itself: PATH first, then the newest
`C:\Program Files\MySQL\MySQL Server <version>\bin` — the version is part of the
install path, so it must never be hardcoded. Override with `MYSQL_BIN_DIR` if
they live somewhere else. Connection details come from `MYSQL_URL` in `.env`,
and the password travels in `MYSQL_PWD` rather than on the command line.

Point it at a different dump with `npm run db:schema:dump -- path/to/dump.sql`.

### The equivalent by hand

If the script ever fails, this is exactly what it runs. `mysqldump` and `mysql`
were not on PATH on the Windows machine at the time of writing; they lived under
`C:\Program Files\MySQL\MySQL Server 8.1\bin\`. In Git Bash — the paths are
absolute, so it does not matter where you run this from:

```bash
MYSQL="/c/Program Files/MySQL/MySQL Server 8.1/bin/mysql"
MYSQLDUMP="/c/Program Files/MySQL/MySQL Server 8.1/bin/mysqldump"
DUMP=/d/projects/inopack/inopack.sql
OUT=/d/projects/inopack/nestjs-inopack-graphql/db/schema.sql

"$MYSQL" -u root -proot -e "DROP DATABASE IF EXISTS inopack_schema_src; CREATE DATABASE inopack_schema_src;"
"$MYSQL" -u root -proot inopack_schema_src < "$DUMP"

"$MYSQLDUMP" -u root -proot --no-data --skip-dump-date --no-tablespaces \
  inopack_schema_src > "$OUT"

"$MYSQLDUMP" -u root -proot --no-create-info --skip-extended-insert --skip-dump-date --no-tablespaces \
  inopack_schema_src migrations >> "$OUT"

"$MYSQL" -u root -proot -e "DROP DATABASE inopack_schema_src;"
```

The `Using a password on the command line interface can be insecure` warning is
expected and harmless here — a local root/root database.

Why those flags:

| Flag | Reason |
|---|---|
| `--no-data` | the point of the exercise — schema only |
| `--no-create-info` | second pass wants the `migrations` rows, not its `CREATE TABLE` again |
| `--skip-extended-insert` | one row per line, so a regenerated snapshot diffs as "3 migrations added" instead of one changed 20 KB line |
| `--skip-dump-date` | drops the `-- Dump completed on …` trailer, which would otherwise churn the diff on every regeneration |
| `--no-tablespaces` | avoids needing the `PROCESS` privilege; harmless when you have it |

No `--routines` or `--triggers`: this database has neither, so the two passes
above are complete.

Dumping from the **stage** server over SSH is a fine alternative — stage is
rebuilt deterministically on every deploy, so it has not drifted either. It just
means handling a server password, and the snapshot then sits close enough to
current that the runner validates almost nothing on rebuild.

## Using it

```bash
npm run db:test:rebuild     # reset (load this file) + migrate (apply anything newer)
```

`db:test:reset` alone loads the snapshot; `db:test:migrate` alone builds and runs
the standalone runner. Neither is part of `pretest` — `npm run test` is watch
mode, and rebuilding a database on every launch is friction for no gain. Rebuild
deliberately, when the schema changes.
