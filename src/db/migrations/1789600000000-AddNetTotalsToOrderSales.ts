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
// It then removes each return from the transfer adjustment that used to balance
// it (see removeReturnsFromTransferAdjustments).
//
// TEST-DB SAFETY: pure DDL with defaults plus UPDATEs that match 0 rows on the
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

        await this.removeReturnsFromTransferAdjustments(queryRunner);
    }

    // One-time data fix. Before net totals existed, a Devolución was balanced by
    // also registering a transfer adjustment (transfers.transfer_type_id = 4) on
    // the sale. Now the net total already subtracts the return, so that transfer
    // adjustment counts it twice and the sale reappears in Saldos y pagos with a
    // negative saldo equal to the return.
    //
    // For each active, non-canceled sale with a return:
    //   reduction = min(return with IVA, the sale's largest positive transfer
    //               adjustment receipt)
    //   - the receipt and its transfer adjustment drop by `reduction`;
    //   - a receipt left at 0 is soft-deleted (active = -1), and so is a transfer
    //     adjustment left without receipts — the same as deleteTransfer;
    //   - the sale's transfer_receipts_total(_no_adjustments) are recomputed the
    //     way updateOrderSalesTransfersTotal does.
    // When the return is larger than the transfer adjustment (or there is none),
    // the remainder stays as a visible negative saldo for manual review.
    //
    // Not reverted by down(): reverting only drops the net columns.
    private async removeReturnsFromTransferAdjustments(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
      CREATE TEMPORARY TABLE tmp_return_transfer_adjustments AS
      SELECT
          order_sales.id AS order_sale_id,
          transfer_receipts.id AS receipt_id,
          transfer_receipts.transfer_id,
          LEAST(
              transfer_receipts.amount,
              ROUND(order_sales.total_with_tax - order_sales.net_total_with_tax, 2)
          ) AS reduction
      FROM order_sales
      JOIN transfer_receipts ON transfer_receipts.id = (
          SELECT tr.id
          FROM transfer_receipts tr
          JOIN transfers t ON t.id = tr.transfer_id
          WHERE tr.order_sale_id = order_sales.id
            AND tr.active = 1
            AND tr.amount > 0
            AND t.active = 1
            AND t.transfer_type_id = 4
          ORDER BY tr.amount DESC, tr.id
          LIMIT 1
      )
      WHERE order_sales.active = 1
        AND order_sales.canceled = 0
        AND ROUND(order_sales.total_with_tax - order_sales.net_total_with_tax, 2) > 0;
    `);

        await queryRunner.query(`
      UPDATE transfer_receipts
      JOIN tmp_return_transfer_adjustments fix ON fix.receipt_id = transfer_receipts.id
      SET transfer_receipts.amount = ROUND(transfer_receipts.amount - fix.reduction, 2),
          transfer_receipts.updated_at = NOW();
    `);

        await queryRunner.query(`
      UPDATE transfers
      JOIN (
          SELECT transfer_id, SUM(reduction) AS reduction
          FROM tmp_return_transfer_adjustments
          GROUP BY transfer_id
      ) fix ON fix.transfer_id = transfers.id
      SET transfers.amount = ROUND(transfers.amount - fix.reduction, 2),
          transfers.updated_at = NOW();
    `);

        await queryRunner.query(`
      UPDATE transfer_receipts
      JOIN tmp_return_transfer_adjustments fix ON fix.receipt_id = transfer_receipts.id
      SET transfer_receipts.active = -1
      WHERE transfer_receipts.amount = 0;
    `);

        await queryRunner.query(`
      UPDATE transfers
      JOIN (SELECT DISTINCT transfer_id FROM tmp_return_transfer_adjustments) fix
        ON fix.transfer_id = transfers.id
      SET transfers.active = -1
      WHERE NOT EXISTS (
          SELECT 1 FROM transfer_receipts
          WHERE transfer_receipts.transfer_id = transfers.id
            AND transfer_receipts.active = 1
      );
    `);

        await queryRunner.query(`
      UPDATE order_sales
      JOIN (SELECT DISTINCT order_sale_id FROM tmp_return_transfer_adjustments) fix
        ON fix.order_sale_id = order_sales.id
      SET order_sales.transfer_receipts_total = (
              SELECT IFNULL(ROUND(SUM(tr.amount), 2), 0)
              FROM transfer_receipts tr
              WHERE tr.order_sale_id = order_sales.id AND tr.active = 1
          ),
          order_sales.transfer_receipts_total_no_adjustments = (
              SELECT IFNULL(ROUND(SUM(tr.amount), 2), 0)
              FROM transfer_receipts tr
              JOIN transfers t ON t.id = tr.transfer_id
              WHERE tr.order_sale_id = order_sales.id
                AND tr.active = 1
                AND t.transfer_type_id != 4
          ),
          order_sales.updated_at = NOW();
    `);

        await queryRunner.query(
            `DROP TEMPORARY TABLE tmp_return_transfer_adjustments;`,
        );
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
