import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProductionEventTables1642357815486
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            drop table production_e_production_et;
        `);

        await queryRunner.query(`
            drop table production_events;
        `);

        await queryRunner.query(`
            drop table production_event_type;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
