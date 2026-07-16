import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserBranchesTable1630345322657
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
          CREATE TABLE \`user_branches\`
          (
              \`id\`         int unsigned NOT NULL AUTO_INCREMENT,
              \`active\`     int          NOT NULL DEFAULT '1',
              \`created_at\` timestamp    NULL     DEFAULT NULL,
              \`updated_at\` timestamp    NULL     DEFAULT NULL,
              \`user_id\`    int unsigned          DEFAULT NULL,
              \`branch_id\`    int unsigned          DEFAULT null,
              PRIMARY KEY (\`id\`),
              KEY \`user_branches_user_id_foreign\` (\`user_id\`),
              CONSTRAINT \`user_branches_user_id_foreign\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`),
              KEY \`user_branches_branch_id_foreign\` (\`branch_id\`),
              CONSTRAINT \`user_branches_branch_id_foreign\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\` (\`id\`)
          ) ENGINE = InnoDB
            AUTO_INCREMENT = 1
            DEFAULT CHARSET = utf8
            COLLATE = utf8_unicode_ci;
      `,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
