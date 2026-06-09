import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateUserConfigsTable1780865825030 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`user_configs\` (
                \`id\`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
                \`active\`     INT          NOT NULL DEFAULT 1,
                \`created_at\` DATETIME(0)  NULL,
                \`updated_at\` DATETIME(0)  NULL,
                \`user_id\`    INT UNSIGNED NOT NULL,
                \`color_mode\` VARCHAR(10)  NOT NULL DEFAULT 'light',
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`user_configs_user_id_unique\` (\`user_id\`),
                INDEX \`user_configs_user_id_foreign\` (\`user_id\`),
                CONSTRAINT \`user_configs_user_id_foreign\`
                    FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
                    ON DELETE NO ACTION ON UPDATE NO ACTION
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`user_configs\``);
    }

}
