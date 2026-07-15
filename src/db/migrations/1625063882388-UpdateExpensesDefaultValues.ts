import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExpensesDefaultValues1625063882388
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("SET SQL_MODE='ALLOW_INVALID_DATES';");

        await queryRunner.query(
            'ALTER TABLE `expenses` MODIFY COLUMN `date_paid` date NULL;',
        );
        await queryRunner.query(
            "ALTER TABLE `expenses` ALTER `description` SET DEFAULT '';",
        );
        // double(8,2)

        await queryRunner.query(
            'ALTER TABLE `expenses` MODIFY COLUMN `subtotal` DOUBLE(8, 2) NOT NULL DEFAULT 0.0;',
        );
        await queryRunner.query(
            "ALTER TABLE `expenses` ALTER `invoice_code` SET DEFAULT '';",
        );
        await queryRunner.query(
            'ALTER TABLE `expenses` MODIFY COLUMN `invoice_paid_date` date NULL;',
        );
        await queryRunner.query(
            'ALTER TABLE `expenses` ALTER `invoice_tax_retained` SET DEFAULT 0.0;',
        );
        await queryRunner.query(
            'ALTER TABLE `expenses` ALTER `tax` SET DEFAULT 0.0;',
        );
        await queryRunner.query(
            'ALTER TABLE `expenses` ALTER `ieps` SET DEFAULT 0.0;',
        );
        await queryRunner.query(
            'ALTER TABLE `expenses` ALTER `invoice_isr_retained` SET DEFAULT 0.0;',
        );
        await queryRunner.query(
            'ALTER TABLE `expenses` MODIFY COLUMN `invoice_provision_date` date NULL;',
        );
        await queryRunner.query(
            "ALTER TABLE `expenses` ALTER `internal_code` SET DEFAULT '';",
        );
        await queryRunner.query(
            "ALTER TABLE `expenses` ALTER `comments` SET DEFAULT '';",
        );
        await queryRunner.query(
            'ALTER TABLE `expenses` MODIFY COLUMN `date_emitted` date NULL;',
        );
        await queryRunner.query(
            'ALTER TABLE `expenses` MODIFY COLUMN `date_refunded` date NULL;',
        );
        await queryRunner.query(
            "update expenses set date_paid = null where date_paid = '0000-00-00' and id > 0;",
        );
        await queryRunner.query(
            "update expenses set date_emitted = null where date_emitted = '0000-00-00' and id > 0;",
        );
        await queryRunner.query(
            "update expenses set date_refunded = null where date_refunded = '0000-00-00' and id > 0;",
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
