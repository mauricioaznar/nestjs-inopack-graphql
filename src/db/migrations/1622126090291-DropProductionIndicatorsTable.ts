import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProductionIndicatorsTable1622126090291
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        DROP TABLE production_indicators
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
