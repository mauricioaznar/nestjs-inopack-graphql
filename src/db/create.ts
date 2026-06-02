import path from 'path';
import fs from 'fs';

const name = process.argv[2];

if (!name) {
  console.error('Usage: npm run migration:create -- <MigrationName>');
  process.exit(1);
}

const timestamp = Date.now();
const className = `${name}${timestamp}`;
const filename = `${timestamp}-${name}.ts`;
const dir = path.join(__dirname, 'migrations');

const content = `import { MigrationInterface, QueryRunner } from 'typeorm';

export class ${className} implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
`;

fs.writeFileSync(path.join(dir, filename), content);
console.log(`Created: src/db/migrations/${filename}`);
