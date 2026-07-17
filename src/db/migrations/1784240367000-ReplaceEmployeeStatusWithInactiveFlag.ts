import { MigrationInterface, QueryRunner } from 'typeorm';

// Replaces the employee_statuses lookup table with a boolean flag on employees,
// mirroring products.discontinued. Order matters: add the flag, backfill it from
// ORDER-PRODUCTION ACTIVITY (an active employee stays active only if they appear
// on an order production in the last 5 months), THEN drop the FK + column + table.
// Finally, discontinue stale products (no appearance on any order document in the
// last 5 months).
//
// NOTE — data-driven & run-time-relative: both backfills use a window relative to
// when the migration runs (CURDATE() - 5 months), so the exact rows affected
// depend on the data + date of each environment where it runs. The activity-based
// flags are NOT recoverable in down() (see below).
export class ReplaceEmployeeStatusWithInactiveFlag1784240367000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1) Add the flag (default active / false).
        await queryRunner.query(
            'ALTER TABLE `employees` ADD `is_inactive` boolean NOT NULL DEFAULT 0',
        );

        // 2) Backfill from order-production activity (replaces the old status-based
        //    rule). An active employee is kept active only if they appear on at
        //    least one order production in the last 5 months — either as an
        //    assigned worker (order_production_employees) or as the production's
        //    direct employee_id. Every other active employee is flagged inactive.
        //    EXCEPTION: Extrusion employees are always kept active (is_inactive =
        //    0), regardless of production activity.
        await queryRunner.query(`
            UPDATE \`employees\` e
            SET e.\`is_inactive\` = 1
            WHERE e.\`active\` = 1
              AND NOT EXISTS (
                  SELECT 1 FROM \`employee_categories\` c
                  WHERE c.\`id\` = e.\`employee_category_id\` AND c.\`name\` = 'Extrusion'
              )
              AND NOT EXISTS (
                  SELECT 1
                  FROM \`order_production_employees\` ope
                  JOIN \`order_productions\` op ON op.\`id\` = ope.\`order_production_id\`
                  WHERE ope.\`employee_id\` = e.\`id\`
                    AND op.\`active\` = 1 AND ope.\`active\` = 1
                    AND op.\`start_date\` >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
              )
              AND NOT EXISTS (
                  SELECT 1
                  FROM \`order_productions\` op2
                  WHERE op2.\`employee_id\` = e.\`id\`
                    AND op2.\`active\` = 1
                    AND op2.\`start_date\` >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
              )
        `);

        // 3) Drop the FK before the column (MySQL won't drop a column still bound
        //    by a foreign key); dropping the column also removes its index.
        await queryRunner.query(
            'ALTER TABLE `employees` DROP FOREIGN KEY `employees_employee_status_id_foreign`',
        );
        await queryRunner.query(
            'ALTER TABLE `employees` DROP COLUMN `employee_status_id`',
        );
        await queryRunner.query('DROP TABLE IF EXISTS `employee_statuses`');

        // 4) Discontinue stale products: any active product with NO appearance on
        //    an order adjustment, order production, order request or order sale in
        //    the last 5 months. Idempotent — products already discontinued stay so.
        await queryRunner.query(`
            UPDATE \`products\` p
            SET p.\`discontinued\` = 1
            WHERE p.\`active\` = 1
              AND NOT EXISTS (
                  SELECT 1
                  FROM \`order_production_products\` opp
                  JOIN \`order_productions\` op ON op.\`id\` = opp.\`order_production_id\`
                  WHERE opp.\`product_id\` = p.\`id\`
                    AND op.\`active\` = 1 AND opp.\`active\` = 1
                    AND op.\`start_date\` >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
              )
              AND NOT EXISTS (
                  SELECT 1
                  FROM \`order_adjustment_products\` oap
                  JOIN \`order_adjustments\` oa ON oa.\`id\` = oap.\`order_adjustment_id\`
                  WHERE oap.\`product_id\` = p.\`id\`
                    AND oa.\`active\` = 1 AND oap.\`active\` = 1
                    AND oa.\`date\` >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
              )
              AND NOT EXISTS (
                  SELECT 1
                  FROM \`order_request_products\` orp
                  JOIN \`order_requests\` orq ON orq.\`id\` = orp.\`order_request_id\`
                  WHERE orp.\`product_id\` = p.\`id\`
                    AND orq.\`active\` = 1 AND orp.\`active\` = 1
                    AND orq.\`date\` >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
              )
              AND NOT EXISTS (
                  SELECT 1
                  FROM \`order_sale_products\` osp
                  JOIN \`order_sales\` os ON os.\`id\` = osp.\`order_sale_id\`
                  WHERE osp.\`product_id\` = p.\`id\`
                    AND os.\`active\` = 1 AND osp.\`active\` = 1
                    AND os.\`date\` >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
              )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Structural restore only. The activity-based backfills are one-way: the
        // original per-employee status ids (beyond Alta/Baja) and the pre-migration
        // products.discontinued values aren't recoverable, so down() only reinstates
        // the table + column and maps the flag back to Alta (1) / Baja (2). It does
        // NOT revert products.discontinued.
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
