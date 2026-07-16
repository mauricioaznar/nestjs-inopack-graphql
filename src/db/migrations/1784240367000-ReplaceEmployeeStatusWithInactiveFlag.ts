import { MigrationInterface, QueryRunner } from 'typeorm';

// Replaces the employee_statuses lookup table with a boolean flag on employees,
// mirroring products.discontinued. Order matters: add the flag, backfill it
// from the old status (Alta = id 1 → active/false; anything else → inactive/
// true, preserving the previous "only status 1 counts" behavior), THEN drop the
// FK + column + table.
export class ReplaceEmployeeStatusWithInactiveFlag1784240367000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE `employees` ADD `is_inactive` boolean NOT NULL DEFAULT 0',
        );

        // Backfill: de alta (status 1) stays active; everything else (Baja, any
        // other status, or NULL) becomes inactive.
        await queryRunner.query(
            'UPDATE `employees` SET `is_inactive` = CASE WHEN `employee_status_id` = 1 THEN 0 ELSE 1 END',
        );

        // Drop the FK before the column (MySQL won't drop a column still bound
        // by a foreign key); dropping the column also removes its index.
        await queryRunner.query(
            'ALTER TABLE `employees` DROP FOREIGN KEY `employees_employee_status_id_foreign`',
        );
        await queryRunner.query(
            'ALTER TABLE `employees` DROP COLUMN `employee_status_id`',
        );
        await queryRunner.query('DROP TABLE IF EXISTS `employee_statuses`');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Structural restore only — the original per-employee status ids beyond
        // Alta/Baja aren't recoverable from a boolean, so this reinstates the
        // table + column and maps the flag back to Alta (1) / Baja (2).
        await queryRunner.query(`
            CREATE TABLE \`employee_statuses\` (
                \`id\`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
                \`name\`       VARCHAR(255) NOT NULL,
                \`active\`     INT          NOT NULL DEFAULT 1,
                \`created_at\` DATETIME(0)  NULL,
                \`updated_at\` DATETIME(0)  NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        await queryRunner.query(
            "INSERT INTO `employee_statuses` (`id`, `name`) VALUES (1, 'Alta'), (2, 'Baja')",
        );
        await queryRunner.query(
            'ALTER TABLE `employees` ADD `employee_status_id` INT UNSIGNED NULL',
        );
        await queryRunner.query(
            'UPDATE `employees` SET `employee_status_id` = CASE WHEN `is_inactive` = 1 THEN 2 ELSE 1 END',
        );
        await queryRunner.query(
            'ALTER TABLE `employees` ADD INDEX `employees_employee_status_id_foreign` (`employee_status_id`)',
        );
        await queryRunner.query(
            'ALTER TABLE `employees` ADD CONSTRAINT `employees_employee_status_id_foreign` ' +
                'FOREIGN KEY (`employee_status_id`) REFERENCES `employee_statuses` (`id`)',
        );
        await queryRunner.query(
            'ALTER TABLE `employees` DROP COLUMN `is_inactive`',
        );
    }
}
