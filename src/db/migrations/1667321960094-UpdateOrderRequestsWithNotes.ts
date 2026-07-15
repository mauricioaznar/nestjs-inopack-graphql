import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderRequestsWithNotes1667321960094
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // `name`         varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL
        await queryRunner.query(
            'ALTER TABLE order_requests ADD `notes` varchar(255) NOT NULL;',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
