import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStartDateColumnInOrderProductions1647553190627
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`SET SQL_MODE='ALLOW_INVALID_DATES';`);
        await queryRunner.query(
            'alter table order_productions add column start_date date not null;',
        );
        await queryRunner.query(
            'update order_productions set start_date = date(order_productions.start_date_time) where id > 0;',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
