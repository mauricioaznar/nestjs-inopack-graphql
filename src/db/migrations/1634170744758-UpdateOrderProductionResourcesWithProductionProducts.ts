import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderProductionResourcesWithProductionProducts1634170744758
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `insert into order_production_resources (
                active,
                created_at,
                updated_at,
                kilos,
                \`groups\`,
                group_weight,
                product_id,
                order_production_id
            ) 
            select 
                order_production_products.active,
                order_production_products.created_at,
                order_production_products.updated_at,
                order_production_products.kilos,
                order_production_products.groups,
                order_production_products.group_weight,
                order_production_products.product_id,
                order_production_products.order_production_id
            from order_productions 
            join order_production_products on order_productions.id = order_production_products.order_production_id
            join products on products.id = order_production_products.product_id
            where order_productions.active = 1
            and order_production_products.active =1
            and order_productions.order_production_type_id != products.order_production_type_id;`,
    );

    await queryRunner.query(`
            update order_production_products
            join order_productions on order_productions.id = order_production_products.order_production_id
            join products on products.id = order_production_products.product_id
            set order_production_products.active = -1
            where order_productions.active = 1
            and order_production_products.active =1
            and order_productions.order_production_type_id != products.order_production_type_id;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
