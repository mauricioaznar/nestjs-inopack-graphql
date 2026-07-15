import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropEquipmentsTables1642351101001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
       drop table equipment_transaction_items;
    `);

        await queryRunner.query(`
       drop table equipment_transactions;
    `);

        await queryRunner.query(`
       drop table equipment_transaction_statuses;
    `);

        await queryRunner.query(`
       drop table equipment_transaction_type;
    `);

        await queryRunner.query(`
       drop table branches_equipments;
    `);

        await queryRunner.query(`
       drop table equipment_photos;
    `);

        await queryRunner.query(`
       drop table machines_equipments;
    `);

        await queryRunner.query(`
       drop table equipments;
    `);

        await queryRunner.query(`
       drop table equipment_subcategories;
    `);

        await queryRunner.query(`
       drop table equipment_categories;
    `);

        await queryRunner.query(`
       drop table equipment_measurement_units;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
