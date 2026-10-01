import { MigrationInterface, QueryRunner } from 'typeorm';

// feature/heron-sales-improvements — return-adjusted (net) sale totals.
//
// Devolución adjustments (order_adjustment_type_id = 6) never reduced the stored
// sale totals, so Saldos y pagos, the sales list and client balances kept asking
// for money the client had already returned. The invoiced columns (subtotal / tax
// / total_with_tax) stay as they are — they are what the contabilidad export
// reports — and three net columns are added beside them:
//
//   net_subtotal       = subtotal − Σ returned kilos/groups × the sale line price
//   net_tax            = tax × net_subtotal / subtotal  (tax when subtotal = 0)
//   net_total_with_tax = net_subtotal + net_tax
//
// Kept up to date by updateOrderSaleNetTotals (common/helpers/sales), whose pure
// math lives in computeOrderSaleNetTotals; the backfill below mirrors it.
//
// TEST-DB SAFETY: pure DDL with defaults plus an UPDATE that matches 0 rows on the
// empty snapshot.
export class AddNetTotalsToOrderSales1789600000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`order_sales\`
        ADD COLUMN \`net_subtotal\` double(12, 2) NOT NULL DEFAULT 0,
        ADD COLUMN \`net_tax\` double(12, 2) NOT NULL DEFAULT 0,
        ADD COLUMN \`net_total_with_tax\` double(12, 2) NOT NULL DEFAULT 0;
    `);

        // Net subtotal first, so the tax and total below can read it.
        await queryRunner.query(`
      UPDATE order_sales
      LEFT JOIN (
          SELECT
              order_sale_products.order_sale_id,
              SUM(
                  returned.kilos * order_sale_products.kilo_price
                  + returned.groups * order_sale_products.group_price
              ) AS returned_value
          FROM order_sale_products
          JOIN (
              SELECT
                  order_adjustments.order_sale_id,
                  order_adjustment_products.product_id,
                  SUM(order_adjustment_products.kilos) AS kilos,
                  SUM(order_adjustment_products.groups) AS \`groups\`
              FROM order_adjustments
              JOIN order_adjustment_products
                ON order_adjustment_products.order_adjustment_id = order_adjustments.id
               AND order_adjustment_products.active = 1
              WHERE order_adjustments.active = 1
                AND order_adjustments.order_adjustment_type_id = 6
                AND order_adjustments.order_sale_id IS NOT NULL
              GROUP BY order_adjustments.order_sale_id, order_adjustment_products.product_id
          ) AS returned
            ON returned.order_sale_id = order_sale_products.order_sale_id
           AND returned.product_id = order_sale_products.product_id
          WHERE order_sale_products.active = 1
          GROUP BY order_sale_products.order_sale_id
      ) AS r ON r.order_sale_id = order_sales.id
      SET order_sales.net_subtotal = ROUND(order_sales.subtotal - IFNULL(r.returned_value, 0), 2);
    `);

        await queryRunner.query(`
      UPDATE order_sales
      SET net_tax = ROUND(IF(subtotal != 0, tax * net_subtotal / subtotal, tax), 2);
    `);

        await queryRunner.query(`
      UPDATE order_sales
      SET net_total_with_tax = ROUND(net_subtotal + net_tax, 2);
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`order_sales\`
        DROP COLUMN \`net_subtotal\`,
        DROP COLUMN \`net_tax\`,
        DROP COLUMN \`net_total_with_tax\`;
    `);
    }
}
