import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropDatesTables1622125740667 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        DROP TABLE date_day
    `);

        await queryRunner.query(`
        DROP TABLE date_thirty_min
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
