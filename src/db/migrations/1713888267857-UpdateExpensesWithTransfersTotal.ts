import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExpensesWithTransfersTotal1713888267857
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE expenses ADD `transfer_receipts_total` double(12, 2) not null default 0;',
    );

    await queryRunner.query(
      'ALTER TABLE expenses ADD `transfer_receipts_total_no_adjustments` double(12, 2) not null default 0;',
    );

    await queryRunner.query(
      'ALTER TABLE expenses ADD `total_with_tax` double(12, 2) not null default 0;',
    );

    await queryRunner.query(`alter table expenses drop column non_tax;`);

    await queryRunner.query(
      `
        UPDATE 
            expenses, 
            ( 
                    select
                    transfer_receipts.expense_id,
                    round(sum(transfer_receipts.amount), 2) as total
                    from transfers
                    join transfer_receipts
                    on transfers.id = transfer_receipts.transfer_id
                    where transfers.active = 1
                    and transfer_receipts.active = 1
                    group by expense_id
            ) AS ztv
        SET expenses.transfer_receipts_total = ztv.total
        WHERE expenses.id = ztv.expense_id;
      `,
    );

    await queryRunner.query(
      `
        UPDATE 
            expenses, 
            ( 
                    select
                    transfer_receipts.expense_id,
                    round(sum(transfer_receipts.amount), 2) as total
                    from transfers
                    join transfer_receipts
                    on transfers.id = transfer_receipts.transfer_id
                    where transfers.active = 1
                    and transfer_receipts.active = 1
                    and transfers.to_account_id is not null
                    and transfers.from_account_id is not null
                    group by transfer_receipts.expense_id
            ) AS ztv
        SET expenses.transfer_receipts_total_no_adjustments = ztv.total
        WHERE expenses.id = ztv.expense_id;
      `,
    );

    await queryRunner.query(
      `
        UPDATE 
            expenses
        SET expenses.total_with_tax = (expenses.subtotal + expenses.tax - expenses.tax_retained - expenses.non_tax_retained)
        WHERE expenses.id > 0;
      `,
    );
  }

  // and

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
