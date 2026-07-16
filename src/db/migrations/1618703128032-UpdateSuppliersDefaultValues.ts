import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSuppliersDefaultValues1618703128032
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `suppliers` ALTER `abbreviation` SET DEFAULT '';",
        );
        await queryRunner.query(
            "ALTER TABLE `suppliers` ALTER `house_phone` SET DEFAULT '';",
        );
        await queryRunner.query(
            "ALTER TABLE `suppliers` ALTER `address1` SET DEFAULT '';",
        );
        await queryRunner.query(
            "ALTER TABLE `suppliers` ALTER `address2` SET DEFAULT '';",
        );
        await queryRunner.query(
            "ALTER TABLE `suppliers` ALTER `country` SET DEFAULT '';",
        );
        await queryRunner.query(
            "ALTER TABLE `suppliers` ALTER `city` SET DEFAULT '';",
        );
        await queryRunner.query(
            "ALTER TABLE `suppliers` ALTER `zip_code` SET DEFAULT '';",
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
