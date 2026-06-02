import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderSalesWithTotals1713992897442
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE order_sales ADD `subtotal` double(12, 2) not null default 0;',
    );

    await queryRunner.query(
      'ALTER TABLE order_sales ADD `tax` double(12, 2) not null default 0;',
    );

    await queryRunner.query(
      'ALTER TABLE order_sales ADD `total_with_tax` double(12, 2) not null default 0;',
    );

    await queryRunner.query(
      'ALTER TABLE order_sales ADD `transfer_receipts_total` double(12, 2) not null default 0;',
    );

    await queryRunner.query(
      'ALTER TABLE order_sales ADD `transfer_receipts_total_no_adjustments` double(12, 2) not null default 0;',
    );

    await queryRunner.query(
      `
        UPDATE 
            order_sales, 
            ( 
                    select
                    transfer_receipts.order_sale_id,
                    round(sum(transfer_receipts.amount), 2) as total
                    from transfers
                    join transfer_receipts
                    on transfers.id = transfer_receipts.transfer_id
                    where transfers.active = 1
                    and transfer_receipts.active = 1
                    group by order_sale_id
            ) AS ztv
        SET order_sales.transfer_receipts_total = ztv.total
        WHERE order_sales.id = ztv.order_sale_id;
      `,
    );

    await queryRunner.query(
      `
        UPDATE 
            order_sales, 
            ( 
                    select
                    transfer_receipts.order_sale_id,
                    round(sum(transfer_receipts.amount), 2) as total
                    from transfers
                    join transfer_receipts
                    on transfers.id = transfer_receipts.transfer_id
                    where transfers.active = 1
                    and transfer_receipts.active = 1
                    and transfers.to_account_id is not null
                    and transfers.from_account_id is not null
                    group by order_sale_id
            ) AS ztv
        SET order_sales.transfer_receipts_total_no_adjustments = ztv.total
        WHERE order_sales.id = ztv.order_sale_id;
      `,
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
        SET order_sales.subtotal = round(ztv.total, 2), order_sales.subtotal = round(ztv.tax, 2), order_sales.total_with_tax = round(ztv.total_with_tax, 2)
        WHERE order_sales.id = ztv.order_sale_id;
      `,
    );

    // await queryRunner.query(
    //   `
    //   UPDATE
    //       expenses
    //   SET expenses.total_with_tax = (expenses.subtotal + expenses.tax - expenses.tax_retained - expenses.non_tax_retained)
    //   WHERE expenses.id > 0;
    // `,
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
