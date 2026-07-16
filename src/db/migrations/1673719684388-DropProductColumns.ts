import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProductColumns1673719684388 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE products DROP FOREIGN KEY products_packing_id_foreign;
    `);

        await queryRunner.query(`
      ALTER TABLE products DROP FOREIGN KEY products_product_type_id_foreign;
    `);

        await queryRunner.query(`
      ALTER TABLE product_type DROP FOREIGN KEY product_type_product_type_category_id_foreign;
    `);

        await queryRunner.query(
            `alter table products drop column product_type_id;`,
        );

        await queryRunner.query(`alter table products drop column packing_id;`);

        await queryRunner.query(`drop table product_type;`);

        await queryRunner.query(`drop table product_type_categories;`);

        await queryRunner.query(`drop table packings;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
