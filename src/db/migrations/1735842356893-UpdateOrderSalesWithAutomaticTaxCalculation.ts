import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderSalesWithAutomaticTaxCalculation1735842356893
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE order_sales ADD `automatic_tax_calculation` boolean NOT NULL default 1;',
        );

        await queryRunner.query(
            `
        UPDATE
            order_sales,
            (
                         select
                  osp.order_sale_id order_sale_id,
                  sum(((osp.kilos) * osp.kilo_price) - ((osp.kilos) * osp.kilo_price * osp.discount / 100) + ((osp.groups) * osp.group_price) - ((osp.groups) * osp.group_price * osp.discount / 100)) total,
                  sum(((osp.kilos) * osp.kilo_price) - ((osp.kilos) * osp.kilo_price * osp.discount / 100) + ((osp.groups ) * osp.group_price) - ((osp.groups) * osp.group_price * osp.discount / 100)) * IF(order_sales.receipt_type_id = 2, 0.16, 0) tax,
                  sum(((osp.kilos) * osp.kilo_price) - ((osp.kilos) * osp.kilo_price * osp.discount / 100) + ((osp.groups) * osp.group_price) - ((osp.groups) * osp.group_price * osp.discount / 100)) * IF(order_sales.receipt_type_id = 2, 1.16, 1) total_with_tax
                  from order_sale_products osp
                  join order_sales
                  on order_sales.id = osp.order_sale_id
                  where order_sales.active = 1
                  and osp.active = 1
                  group by osp.order_sale_id
            ) AS ztv
        SET order_sales.subtotal = round(ztv.total, 2), order_sales.tax = round(ztv.tax, 2), order_sales.total_with_tax = round(ztv.total_with_tax, 2)
        WHERE order_sales.id = ztv.order_sale_id;
      `,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
