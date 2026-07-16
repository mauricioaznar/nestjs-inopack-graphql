import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProductsDefaultValues1618461782360
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'UPDATE `products` SET `current_group_weight` = 0.0 WHERE `current_group_weight` IS null;',
        );
        await queryRunner.query(
            'ALTER TABLE `products` MODIFY `current_group_weight` double(8,2) NOT NULL DEFAULT 0.0;',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
