import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserRolesTable1630163670261 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
          CREATE TABLE \`user_roles\`
          (
              \`id\`           int unsigned                                            NOT NULL AUTO_INCREMENT,
              \`active\`       int                                                     NOT NULL DEFAULT '1',
              \`created_at\`   timestamp                                               NULL     DEFAULT NULL,
              \`updated_at\`   timestamp                                               NULL     DEFAULT NULL,
              \`user_id\` int unsigned                                                     DEFAULT NULL,
              \`role_id\`         int unsigned                                                     DEFAULT null,
              PRIMARY KEY (\`id\`),
              KEY \`user_roles_user_id_foreign\` (\`user_id\`),
              CONSTRAINT \`user_roles_user_id_foreign\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`),
              KEY \`user_roles_role_id_foreign\` (\`role_id\`),
              CONSTRAINT \`user_roles_role_id_foreign\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`)
          ) ENGINE = InnoDB
            AUTO_INCREMENT = 1
            DEFAULT CHARSET = utf8
            COLLATE = utf8_unicode_ci;
      `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
