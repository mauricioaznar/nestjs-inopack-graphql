import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExpenseResources1764102994283 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        /*
            current_group_price
            current_unit_price
            current_group_weight
            group_weight_strict
            
         */

        await queryRunner.query(
            `ALTER TABLE resources ADD \`current_group_price\` double(8, 2) not null default 0`,
        );
        await queryRunner.query(
            `ALTER TABLE resources ADD \`current_unit_price\` double(8, 2) not null default 0`,
        );
        await queryRunner.query(
            `ALTER TABLE resources ADD \`current_group_weight\` double(8, 2) not null default 0`,
        );
        await queryRunner.query(
            `ALTER TABLE resources ADD \`group_weight_strict\` double(8, 2) not null default 0`,
        );

        await queryRunner.query(`
      ALTER TABLE expense_raw_material_additions DROP FOREIGN KEY erma_raw_material_addition_id_foreign;
    `);

        await queryRunner.query(`
      ALTER TABLE expense_raw_material_additions DROP FOREIGN KEY erma_expense_id_foreign;
    `);

        await queryRunner.query(`drop table expense_raw_material_additions`);

        await queryRunner.query(
            `ALTER TABLE raw_material_addition_items DROP FOREIGN KEY raw_material_addition_item_addition_id_foreign;`,
        );

        await queryRunner.query(
            `ALTER TABLE raw_material_addition_items DROP FOREIGN KEY raw_material_addition_item_resource_id_foreign;`,
        );

        await queryRunner.query(`drop table raw_material_addition_items`);

        await queryRunner.query(
            `ALTER TABLE raw_material_additions DROP FOREIGN KEY raw_material_addition_account_id_foreign;`,
        );

        await queryRunner.query(`drop table raw_material_additions`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
