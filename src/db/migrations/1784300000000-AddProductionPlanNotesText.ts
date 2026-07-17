import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductionPlanNotesText1784300000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Notes become newline-separated bullet lists — widen to TEXT so long
        // lists aren't truncated at 255 chars. TEXT can't carry a DEFAULT
        // (MySQL < 8.0.13), so the default is dropped; every write path sends
        // the columns explicitly.
        await queryRunner.query(
            `ALTER TABLE \`production_plans\` MODIFY \`notes\` TEXT NOT NULL;`,
        );
        // NEW column holding the "productos" notes list (existing rows get '').
        await queryRunner.query(
            `ALTER TABLE \`production_plans\` ADD COLUMN \`product_notes\` TEXT NOT NULL AFTER \`notes\`;`,
        );
        await queryRunner.query(
            `ALTER TABLE \`production_plan_rows\` MODIFY \`notes\` TEXT NOT NULL;`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`production_plans\` DROP COLUMN \`product_notes\`;`,
        );
        // Reverting to VARCHAR(255) may truncate rows longer than 255 chars —
        // acceptable on a down migration.
        await queryRunner.query(
            `ALTER TABLE \`production_plans\` MODIFY \`notes\` VARCHAR(255) NOT NULL DEFAULT '';`,
        );
        await queryRunner.query(
            `ALTER TABLE \`production_plan_rows\` MODIFY \`notes\` VARCHAR(255) NOT NULL DEFAULT '';`,
        );
    }
}
