import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProductWithExtraFields1670438976705
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE products ADD `internal_description` varchar(255) NOT NULL;',
        );

        await queryRunner.query(
            'ALTER TABLE products ADD `external_description` varchar(255) NOT NULL;',
        );

        await queryRunner.query(
            'ALTER TABLE products ADD `discontinued` boolean not null default 0',
        );

        await queryRunner.query(
            `update products set products.external_description = products.description;`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
