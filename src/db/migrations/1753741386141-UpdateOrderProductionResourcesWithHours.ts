import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderProductionResourcesWithHours1753741386141
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE order_production_resources ADD `hours` double(12, 2) default null;',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
