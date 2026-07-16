import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayroll1780625453563 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // =====================================================================
        // PRODUCTION-SAFE seed — employee categories (areas).
        // This block is real reference data + a real assignment migration and
        // MUST ship to master (unlike the temporary payroll seed at the bottom).
        // =====================================================================
        await queryRunner.query(`
            CREATE TABLE \`employee_categories\` (
                \`id\`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
                \`active\`     INT          NOT NULL DEFAULT 1,
                \`created_at\` DATETIME(0)  NULL,
                \`updated_at\` DATETIME(0)  NULL,
                \`name\`       VARCHAR(100) NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await queryRunner.query(`
            ALTER TABLE \`employees\`
                ADD COLUMN \`employee_category_id\` INT UNSIGNED NULL,
                ADD INDEX \`employees_employee_category_id_foreign\` (\`employee_category_id\`),
                ADD CONSTRAINT \`employees_employee_category_id_foreign\`
                    FOREIGN KEY (\`employee_category_id\`) REFERENCES \`employee_categories\` (\`id\`);
        `);

        await queryRunner.query(`
            INSERT INTO \`employee_categories\` (\`name\`) VALUES
                ('Bolseo'), ('Extrusion'), ('Mantenimiento'), ('Choferes'), ('Administrativo');
        `);

        // Best-effort assignment from existing job role (employee_type).
        // Peletizador / Lavador and Administrativo staff are left NULL on purpose
        // for manual assignment later.
        await queryRunner.query(`
            UPDATE \`employees\` e
            JOIN \`employee_type\` t ON e.\`employee_type_id\` = t.\`id\`
            JOIN \`employee_categories\` c ON c.\`name\` = CASE
                WHEN t.\`name\` = 'Extrusor'                 THEN 'Extrusion'
                WHEN t.\`name\` = 'Chofer'                   THEN 'Choferes'
                WHEN t.\`name\` = 'Mantenimiento'            THEN 'Mantenimiento'
                WHEN t.\`name\` IN ('Operador', 'Ayudante')  THEN 'Bolseo'
                ELSE NULL
            END
            SET e.\`employee_category_id\` = c.\`id\`;
        `);

        await queryRunner.query(`
            CREATE TABLE \`payroll_periods\` (
                \`id\`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
                \`active\`     INT          NOT NULL DEFAULT 1,
                \`created_at\` DATETIME(0)  NULL,
                \`updated_at\` DATETIME(0)  NULL,
                \`branch_id\`  INT UNSIGNED NULL,
                \`start_date\` DATE         NOT NULL,
                \`end_date\`   DATE         NOT NULL,
                \`week_number\` INT         NOT NULL DEFAULT 0,
                PRIMARY KEY (\`id\`),
                INDEX \`payroll_periods_branch_id_foreign\` (\`branch_id\`),
                CONSTRAINT \`payroll_periods_branch_id_foreign\`
                    FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\` (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await queryRunner.query(`
            CREATE TABLE \`payroll_entries\` (
                \`id\`                         INT UNSIGNED   NOT NULL AUTO_INCREMENT,
                \`active\`                     INT            NOT NULL DEFAULT 1,
                \`created_at\`                 DATETIME(0)    NULL,
                \`updated_at\`                 DATETIME(0)    NULL,
                \`payroll_period_id\`          INT UNSIGNED   NOT NULL,
                \`employee_id\`                INT UNSIGNED   NOT NULL,

                -- manual input fields
                -- area is derived from the employee's category; puesto is replaced
                -- by employees.is_leader — neither is stored on the entry anymore.
                \`estatus\`                    VARCHAR(50)    NOT NULL DEFAULT 'ALTA',
                \`control_bono_area\`          TINYINT(1)     NOT NULL DEFAULT 0,
                \`control_deposito\`           TINYINT(1)     NOT NULL DEFAULT 0,
                \`sueldo\`                     FLOAT          NOT NULL DEFAULT 0,
                \`jo\`                         FLOAT          NOT NULL DEFAULT 48,
                \`ht\`                         FLOAT          NOT NULL DEFAULT 0,
                \`he\`                         FLOAT          NOT NULL DEFAULT 0,
                \`he_override\`                TINYINT(1)     NOT NULL DEFAULT 0,
                \`retardos\`                   INT            NOT NULL DEFAULT 0,
                \`faltas\`                     INT            NOT NULL DEFAULT 0,
                \`vac\`                        FLOAT          NOT NULL DEFAULT 0,
                \`dias_festivos\`              FLOAT          NOT NULL DEFAULT 0,
                \`infonavit\`                  FLOAT          NOT NULL DEFAULT 0,
                \`fonacot\`                    FLOAT          NOT NULL DEFAULT 0,
                \`descuento_prestamos\`        FLOAT          NOT NULL DEFAULT 0,
                \`otros_menos\`               FLOAT          NOT NULL DEFAULT 0,
                \`entregas_especiales\`        FLOAT          NOT NULL DEFAULT 0,
                \`viajes\`                     FLOAT          NOT NULL DEFAULT 0,
                \`bonos\`                      FLOAT          NOT NULL DEFAULT 0,
                \`otros_mas\`                 FLOAT          NOT NULL DEFAULT 0,
                \`bd\`                         FLOAT          NOT NULL DEFAULT 0,
                \`observaciones\`              VARCHAR(500)   NOT NULL DEFAULT '',

                PRIMARY KEY (\`id\`),
                INDEX \`payroll_entries_period_id_foreign\` (\`payroll_period_id\`),
                INDEX \`payroll_entries_employee_id_foreign\` (\`employee_id\`),
                CONSTRAINT \`payroll_entries_period_id_foreign\`
                    FOREIGN KEY (\`payroll_period_id\`) REFERENCES \`payroll_periods\` (\`id\`),
                CONSTRAINT \`payroll_entries_employee_id_foreign\`
                    FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // =====================================================================
        // TODO: TEMPORARY TEST DATA — REMOVE BEFORE MERGING feature/payroll
        // Seeds one payroll period + entries for up to 5 active employees so a
        // freshly recreated DB has data to test against. All other columns fall
        // back to their table defaults. Delete this whole block before merge.
        // =====================================================================
        await queryRunner.query(`
            INSERT INTO \`payroll_periods\` (\`start_date\`, \`end_date\`, \`week_number\`, \`branch_id\`)
            VALUES ('2026-03-25', '2026-03-31', 13, 1);
        `);
        await queryRunner.query(`
            INSERT INTO \`payroll_entries\` (\`payroll_period_id\`, \`employee_id\`, \`sueldo\`)
            SELECT LAST_INSERT_ID(), \`id\`, \`base_salary\`
            FROM \`employees\`
            WHERE \`active\` = 1 AND \`employee_status_id\` = 1 AND \`branch_id\` = 1
            LIMIT 5;
        `);
        // ===================== END TEMPORARY TEST DATA =======================
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`payroll_entries\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`payroll_periods\``);
        await queryRunner.query(
            `ALTER TABLE \`employees\` DROP FOREIGN KEY \`employees_employee_category_id_foreign\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`employees\` DROP COLUMN \`employee_category_id\``,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS \`employee_categories\``);
    }
}
