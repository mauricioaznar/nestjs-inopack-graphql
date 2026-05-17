import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCreatedAtAndUpdatedAtFields1621449178124
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("SET SQL_MODE='ALLOW_INVALID_DATES';");

    // users
    await queryRunner.query(
      'ALTER TABLE `users` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `users` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `users` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `users` ALTER `updated_at` SET DEFAULT null;',
    );

    // suppliers
    await queryRunner.query(
      'ALTER TABLE `suppliers` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `suppliers` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `suppliers` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `suppliers` ALTER `updated_at` SET DEFAULT null;',
    );

    // roles
    await queryRunner.query(
      'ALTER TABLE `roles` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `roles` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `roles` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `roles` ALTER `updated_at` SET DEFAULT null;',
    );

    // products
    await queryRunner.query(
      'ALTER TABLE `products` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `products` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `products` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `products` ALTER `updated_at` SET DEFAULT null;',
    );

    // production_indicators
    await queryRunner.query(
      'ALTER TABLE `production_indicators` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `production_indicators` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `production_indicators` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `production_indicators` ALTER `updated_at` SET DEFAULT null;',
    );

    // production_events
    await queryRunner.query(
      'ALTER TABLE `production_events` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `production_events` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `production_events` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `production_events` ALTER `updated_at` SET DEFAULT null;',
    );

    // production_event_type
    await queryRunner.query(
      'ALTER TABLE `production_event_type` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `production_event_type` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `production_event_type` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `production_event_type` ALTER `updated_at` SET DEFAULT null;',
    );

    // production_e_production_et
    await queryRunner.query(
      'ALTER TABLE `production_e_production_et` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `production_e_production_et` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `production_e_production_et` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `production_e_production_et` ALTER `updated_at` SET DEFAULT null;',
    );

    // product_type
    await queryRunner.query(
      'ALTER TABLE `product_type` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `product_type` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `product_type` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `product_type` ALTER `updated_at` SET DEFAULT null;',
    );

    // payrolls
    await queryRunner.query(
      'ALTER TABLE `payrolls` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `payrolls` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `payrolls` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `payrolls` ALTER `updated_at` SET DEFAULT null;',
    );

    // payroll_type
    await queryRunner.query(
      'ALTER TABLE `payroll_type` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `payroll_type` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `payroll_type` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `payroll_type` ALTER `updated_at` SET DEFAULT null;',
    );

    // payroll_payments
    await queryRunner.query(
      'ALTER TABLE `payroll_payments` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `payroll_payments` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `payroll_payments` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `payroll_payments` ALTER `updated_at` SET DEFAULT null;',
    );

    // packings
    await queryRunner.query(
      'ALTER TABLE `packings` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `packings` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `packings` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `packings` ALTER `updated_at` SET DEFAULT null;',
    );

    // other_incomes
    await queryRunner.query(
      'ALTER TABLE `other_incomes` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `other_incomes` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `other_incomes` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `other_incomes` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_sales
    await queryRunner.query(
      'ALTER TABLE `order_sales` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sales` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sales` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sales` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_sale_statuses
    await queryRunner.query(
      'ALTER TABLE `order_sale_statuses` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_statuses` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_statuses` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_statuses` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_sale_receipt_type
    await queryRunner.query(
      'ALTER TABLE `order_sale_receipt_type` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_receipt_type` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_receipt_type` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_receipt_type` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_sale_products
    await queryRunner.query(
      'ALTER TABLE `order_sale_products` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_products` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_products` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_products` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_sale_payments
    await queryRunner.query(
      'ALTER TABLE `order_sale_payments` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_payments` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_payments` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_payments` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_sale_payment_type
    await queryRunner.query(
      'ALTER TABLE `order_sale_payment_type` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_payment_type` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_payment_type` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_payment_type` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_sale_collection_statuses
    await queryRunner.query(
      'ALTER TABLE `order_sale_collection_statuses` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_collection_statuses` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_collection_statuses` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_sale_collection_statuses` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_returns
    await queryRunner.query(
      'ALTER TABLE `order_returns` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_returns` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_returns` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_returns` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_return_type
    await queryRunner.query(
      'ALTER TABLE `order_return_type` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_return_type` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_return_type` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_return_type` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_requests
    await queryRunner.query(
      'ALTER TABLE `order_requests` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_requests` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_requests` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_requests` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_request_statuses
    await queryRunner.query(
      'ALTER TABLE `order_request_statuses` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_request_statuses` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_request_statuses` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_request_statuses` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_request_products
    await queryRunner.query(
      'ALTER TABLE `order_request_products` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_request_products` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_request_products` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_request_products` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_productions
    await queryRunner.query(
      'ALTER TABLE `order_productions` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_productions` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_productions` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_productions` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_production_type
    await queryRunner.query(
      'ALTER TABLE `order_production_type` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_production_type` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_production_type` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_production_type` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_production_products
    await queryRunner.query(
      'ALTER TABLE `order_production_products` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_production_products` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_production_products` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_production_products` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_production_employees
    await queryRunner.query(
      'ALTER TABLE `order_production_employees` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_production_employees` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_production_employees` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_production_employees` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_adjustments
    await queryRunner.query(
      'ALTER TABLE `order_adjustments` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_adjustments` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_adjustments` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_adjustments` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_adjustment_type
    await queryRunner.query(
      'ALTER TABLE `order_adjustment_type` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_adjustment_type` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_adjustment_type` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_adjustment_type` ALTER `updated_at` SET DEFAULT null;',
    );

    // order_adjustment_products
    await queryRunner.query(
      'ALTER TABLE `order_adjustment_products` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_adjustment_products` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_adjustment_products` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `order_adjustment_products` ALTER `updated_at` SET DEFAULT null;',
    );

    // materials
    await queryRunner.query(
      'ALTER TABLE `materials` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `materials` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `materials` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `materials` ALTER `updated_at` SET DEFAULT null;',
    );

    // material_esproportions
    await queryRunner.query(
      'ALTER TABLE `material_esproportions` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `material_esproportions` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `material_esproportions` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `material_esproportions` ALTER `updated_at` SET DEFAULT null;',
    );

    // machines_equipments
    await queryRunner.query(
      'ALTER TABLE `machines_equipments` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `machines_equipments` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `machines_equipments` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `machines_equipments` ALTER `updated_at` SET DEFAULT null;',
    );

    // machines
    await queryRunner.query(
      'ALTER TABLE `machines` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `machines` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `machines` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `machines` ALTER `updated_at` SET DEFAULT null;',
    );

    // machine_type
    await queryRunner.query(
      'ALTER TABLE `machine_type` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `machine_type` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `machine_type` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `machine_type` ALTER `updated_at` SET DEFAULT null;',
    );

    // expenses
    await queryRunner.query(
      'ALTER TABLE `expenses` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expenses` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expenses` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expenses` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_type
    await queryRunner.query(
      'ALTER TABLE `expense_type` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_type` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_type` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_type` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_subcategory_frequencies
    await queryRunner.query(
      'ALTER TABLE `expense_subcategory_frequencies` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_subcategory_frequencies` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_subcategory_frequencies` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_subcategory_frequencies` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_subcategories_estcosts
    await queryRunner.query(
      'ALTER TABLE `expense_subcategories_estcosts` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_subcategories_estcosts` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_subcategories_estcosts` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_subcategories_estcosts` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_subcategories
    await queryRunner.query(
      'ALTER TABLE `expense_subcategories` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_subcategories` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_subcategories` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_subcategories` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_statuses
    await queryRunner.query(
      'ALTER TABLE `expense_statuses` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_statuses` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_statuses` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_statuses` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_products
    await queryRunner.query(
      'ALTER TABLE `expense_products` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_products` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_products` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_products` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_payments
    await queryRunner.query(
      'ALTER TABLE `expense_payments` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_payments` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_payments` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_payments` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_money_sources
    await queryRunner.query(
      'ALTER TABLE `expense_money_sources` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_money_sources` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_money_sources` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_money_sources` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_items
    await queryRunner.query(
      'ALTER TABLE `expense_items` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_items` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_items` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_items` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_invoice_type
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_type` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_type` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_type` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_type` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_invoice_statuses
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_statuses` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_statuses` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_statuses` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_statuses` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_invoice_payment_methods
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_payment_methods` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_payment_methods` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_payment_methods` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_payment_methods` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_invoice_payment_forms
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_payment_forms` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_payment_forms` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_payment_forms` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_payment_forms` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_invoice_complements
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_complements` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_complements` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_complements` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_complements` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_invoice_cdfi_uses
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_cdfi_uses` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_cdfi_uses` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_cdfi_uses` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_invoice_cdfi_uses` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_credit_notes
    await queryRunner.query(
      'ALTER TABLE `expense_credit_notes` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_credit_notes` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_credit_notes` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_credit_notes` ALTER `updated_at` SET DEFAULT null;',
    );

    // expense_categories
    await queryRunner.query(
      'ALTER TABLE `expense_categories` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_categories` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_categories` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `expense_categories` ALTER `updated_at` SET DEFAULT null;',
    );

    // equipments
    await queryRunner.query(
      'ALTER TABLE `equipments` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipments` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipments` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipments` ALTER `updated_at` SET DEFAULT null;',
    );

    // equipment_transactions
    await queryRunner.query(
      'ALTER TABLE `equipment_transactions` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_transactions` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_transactions` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_transactions` ALTER `updated_at` SET DEFAULT null;',
    );

    // equipment_transaction_type
    await queryRunner.query(
      'ALTER TABLE `equipment_transaction_type` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_transaction_type` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_transaction_type` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_transaction_type` ALTER `updated_at` SET DEFAULT null;',
    );

    // equipment_transaction_statuses
    await queryRunner.query(
      'ALTER TABLE `equipment_transaction_statuses` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_transaction_statuses` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_transaction_statuses` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_transaction_statuses` ALTER `updated_at` SET DEFAULT null;',
    );

    // equipment_transaction_items
    await queryRunner.query(
      'ALTER TABLE `equipment_transaction_items` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_transaction_items` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_transaction_items` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_transaction_items` ALTER `updated_at` SET DEFAULT null;',
    );

    // equipment_subcategories
    await queryRunner.query(
      'ALTER TABLE `equipment_subcategories` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_subcategories` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_subcategories` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_subcategories` ALTER `updated_at` SET DEFAULT null;',
    );

    // equipment_measurement_units
    await queryRunner.query(
      'ALTER TABLE `equipment_measurement_units` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_measurement_units` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_measurement_units` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_measurement_units` ALTER `updated_at` SET DEFAULT null;',
    );

    // equipment_categories
    await queryRunner.query(
      'ALTER TABLE `equipment_categories` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_categories` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_categories` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `equipment_categories` ALTER `updated_at` SET DEFAULT null;',
    );

    // employees
    await queryRunner.query(
      'ALTER TABLE `employees` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `employees` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `employees` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `employees` ALTER `updated_at` SET DEFAULT null;',
    );

    // employee_type
    await queryRunner.query(
      'ALTER TABLE `employee_type` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `employee_type` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `employee_type` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `employee_type` ALTER `updated_at` SET DEFAULT null;',
    );

    // employee_statuses
    await queryRunner.query(
      'ALTER TABLE `employee_statuses` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `employee_statuses` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `employee_statuses` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `employee_statuses` ALTER `updated_at` SET DEFAULT null;',
    );

    // employee_attendances
    await queryRunner.query(
      'ALTER TABLE `employee_attendances` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `employee_attendances` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `employee_attendances` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `employee_attendances` ALTER `updated_at` SET DEFAULT null;',
    );

    // date_thirty_min
    await queryRunner.query(
      'ALTER TABLE `date_thirty_min` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `date_thirty_min` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `date_thirty_min` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `date_thirty_min` ALTER `updated_at` SET DEFAULT null;',
    );

    // date_day
    await queryRunner.query(
      'ALTER TABLE `date_day` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `date_day` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `date_day` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `date_day` ALTER `updated_at` SET DEFAULT null;',
    );

    // clients
    await queryRunner.query(
      'ALTER TABLE `clients` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `clients` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `clients` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `clients` ALTER `updated_at` SET DEFAULT null;',
    );

    // client_contacts
    await queryRunner.query(
      'ALTER TABLE `client_contacts` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `client_contacts` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `client_contacts` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `client_contacts` ALTER `updated_at` SET DEFAULT null;',
    );

    // branches_equipments
    await queryRunner.query(
      'ALTER TABLE `branches_equipments` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `branches_equipments` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `branches_equipments` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `branches_equipments` ALTER `updated_at` SET DEFAULT null;',
    );

    // branches
    await queryRunner.query(
      'ALTER TABLE `branches` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `branches` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `branches` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `branches` ALTER `updated_at` SET DEFAULT null;',
    );

    // activities
    await queryRunner.query(
      'ALTER TABLE `activities` MODIFY COLUMN `created_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `activities` MODIFY COLUMN `updated_at` datetime NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE `activities` ALTER `created_at` SET DEFAULT null;',
    );
    await queryRunner.query(
      'ALTER TABLE `activities` ALTER `updated_at` SET DEFAULT null;',
    );
    //  `exit_date_time` datetime NOT NULL,
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
