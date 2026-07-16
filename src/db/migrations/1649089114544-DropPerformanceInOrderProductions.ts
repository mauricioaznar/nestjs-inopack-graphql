import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPerformanceInOrderProductions1649089114544
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `alter table order_productions drop column performance;`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
