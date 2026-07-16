import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProductionAndEmployees1751046633324
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE employees ADD `is_leader` int NOT NULL default 0;',
        );

        await queryRunner.query(
            'ALTER TABLE order_productions ADD `shift` int default null;',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
