import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function getMigrationFiles(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+-.+\.js$/.test(f))
    .sort();
}

function getClassName(filePath: string): string {
  const mod = require(filePath);
  const cls = Object.values(mod)[0] as { name: string };
  return cls.name;
}

async function run() {
  const url = process.env.MYSQL_URL;
  if (!url) throw new Error('MYSQL_URL is not set');

  const connection = await mysql.createConnection(url);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`migrations\` (
      \`id\`        INT NOT NULL AUTO_INCREMENT,
      \`timestamp\` BIGINT NOT NULL,
      \`name\`      VARCHAR(255) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci
  `);

  const [rows] = await connection.query('SELECT `name` FROM `migrations`');
  const executed = new Set((rows as any[]).map((r) => r.name));

  const queryRunner = {
    query: (sql: string, params?: any[]) => connection.query(sql, params),
  };

  const files = getMigrationFiles();
  let ran = 0;

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const className = getClassName(filePath);

    if (executed.has(className)) continue;

    console.log(`Running: ${file}`);
    const mod = require(filePath);
    const MigrationClass = Object.values(mod)[0] as any;
    await new MigrationClass().up(queryRunner);

    const timestamp = parseInt(file.split('-')[0], 10);
    await connection.query(
      'INSERT INTO `migrations` (`timestamp`, `name`) VALUES (?, ?)',
      [timestamp, className],
    );

    console.log(`  done`);
    ran++;
  }

  await connection.end();

  if (ran === 0) {
    console.log('No pending migrations.');
  } else {
    console.log(`\n${ran} migration(s) completed.`);
  }
}

run().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
