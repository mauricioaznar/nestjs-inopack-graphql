import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateActivitiesTableWithRolesAndBranches1630355349654
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE activities ADD `role_id` int unsigned DEFAULT NULL;',
        );
        await queryRunner.query(
            'ALTER TABLE activities ADD CONSTRAINT activities_role_id_foreign FOREIGN KEY (role_id) REFERENCES roles(id);',
        );
        await queryRunner.query(
            'ALTER TABLE activities ADD `branch_id` int unsigned DEFAULT NULL;',
        );
        await queryRunner.query(
            'ALTER TABLE activities ADD CONSTRAINT activities_branch_id_foreign FOREIGN KEY (branch_id) REFERENCES branches(id);',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
