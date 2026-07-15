import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductionPlans1784160000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
          CREATE TABLE \`production_plans\`
          (
              \`id\`         int unsigned NOT NULL AUTO_INCREMENT,
              \`active\`     int          NOT NULL DEFAULT '1',
              \`created_at\` datetime     NULL     DEFAULT NULL,
              \`updated_at\` datetime     NULL     DEFAULT NULL,
              \`date\`       datetime     NOT NULL,
              \`shift\`      int          NOT NULL DEFAULT '1',
              \`branch_id\`  int unsigned          DEFAULT NULL,
              \`notes\`      varchar(255) NOT NULL DEFAULT '',
              PRIMARY KEY (\`id\`),
              KEY \`production_plans_branch_id_foreign\` (\`branch_id\`),
              CONSTRAINT \`production_plans_branch_id_foreign\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\` (\`id\`)
          ) ENGINE = InnoDB
            AUTO_INCREMENT = 1
            DEFAULT CHARSET = utf8
            COLLATE = utf8_unicode_ci;
      `,
        );

        await queryRunner.query(
            `
          CREATE TABLE \`production_plan_rows\`
          (
              \`id\`                 int unsigned NOT NULL AUTO_INCREMENT,
              \`active\`             int          NOT NULL DEFAULT '1',
              \`created_at\`         datetime     NULL     DEFAULT NULL,
              \`updated_at\`         datetime     NULL     DEFAULT NULL,
              \`production_plan_id\` int unsigned          DEFAULT NULL,
              \`machine_id\`         int unsigned          DEFAULT NULL,
              \`product_id\`         int unsigned          DEFAULT NULL,
              \`notes\`              varchar(255) NOT NULL DEFAULT '',
              \`position\`           int          NOT NULL DEFAULT '0',
              PRIMARY KEY (\`id\`),
              KEY \`production_plan_rows_production_plan_id_foreign\` (\`production_plan_id\`),
              KEY \`production_plan_rows_machine_id_foreign\` (\`machine_id\`),
              KEY \`production_plan_rows_product_id_foreign\` (\`product_id\`),
              CONSTRAINT \`production_plan_rows_production_plan_id_foreign\` FOREIGN KEY (\`production_plan_id\`) REFERENCES \`production_plans\` (\`id\`),
              CONSTRAINT \`production_plan_rows_machine_id_foreign\` FOREIGN KEY (\`machine_id\`) REFERENCES \`machines\` (\`id\`),
              CONSTRAINT \`production_plan_rows_product_id_foreign\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`)
          ) ENGINE = InnoDB
            AUTO_INCREMENT = 1
            DEFAULT CHARSET = utf8
            COLLATE = utf8_unicode_ci;
      `,
        );

        await queryRunner.query(
            `
          CREATE TABLE \`production_plan_row_employees\`
          (
              \`id\`                     int unsigned NOT NULL AUTO_INCREMENT,
              \`active\`                 int          NOT NULL DEFAULT '1',
              \`created_at\`             datetime     NULL     DEFAULT NULL,
              \`updated_at\`             datetime     NULL     DEFAULT NULL,
              \`production_plan_row_id\` int unsigned          DEFAULT NULL,
              \`employee_id\`            int unsigned          DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              KEY \`production_plan_row_employees_row_id_foreign\` (\`production_plan_row_id\`),
              KEY \`production_plan_row_employees_employee_id_foreign\` (\`employee_id\`),
              CONSTRAINT \`production_plan_row_employees_row_id_foreign\` FOREIGN KEY (\`production_plan_row_id\`) REFERENCES \`production_plan_rows\` (\`id\`),
              CONSTRAINT \`production_plan_row_employees_employee_id_foreign\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`)
          ) ENGINE = InnoDB
            AUTO_INCREMENT = 1
            DEFAULT CHARSET = utf8
            COLLATE = utf8_unicode_ci;
      `,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP TABLE IF EXISTS \`production_plan_row_employees\`;`,
        );
        await queryRunner.query(
            `DROP TABLE IF EXISTS \`production_plan_rows\`;`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS \`production_plans\`;`);
    }
}
