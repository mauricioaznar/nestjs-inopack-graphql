import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAccountsWithCheckboxes1695076747401
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`accounts\`
                ADD COLUMN \`is_supplier\` boolean NOT NULL DEFAULT 0;
        `);

        await queryRunner.query(`
            ALTER TABLE \`accounts\`
                ADD COLUMN \`is_client\` boolean NOT NULL DEFAULT 0;
        `);

        await queryRunner.query(`
            ALTER TABLE \`accounts\`
                ADD COLUMN \`is_own\` boolean NOT NULL DEFAULT 0;
        `);

        await queryRunner.query(`
            update accounts set is_own = 1 where account_type_id = 1;
        `);

        await queryRunner.query(`
            update accounts set is_client = 1 where account_type_id = 2;
        `);

        await queryRunner.query(`
            update accounts set is_supplier = 1 where account_type_id = 3;
        `);

        await queryRunner.query(`
            update transfers set from_account_id = 4 where from_account_id = 130;
    `);

        await queryRunner.query(`
            update transfers set to_account_id = 4 where to_account_id = 130;
    `);

        await queryRunner.query(`
            update expenses set account_id = 4 where account_id = 130;
    `);

        await queryRunner.query(`
            update order_requests set account_id = 4 where account_id = 130;
    `);

        await queryRunner.query(`
           update accounts set active = -1 where id = 130;
    `);

        await queryRunner.query(`
            update transfers set from_account_id = 61 where from_account_id = 25;
    `);

        await queryRunner.query(`
            update transfers set to_account_id = 61 where to_account_id = 25;
    `);

        await queryRunner.query(`
            update expenses set account_id = 61 where account_id = 25;
    `);

        await queryRunner.query(`
            update order_requests set account_id = 61 where account_id = 25;
    `);

        await queryRunner.query(`
           update accounts set active = -1 where id = 25;
    `);

        await queryRunner.query(`
            update transfers set from_account_id = 43 where from_account_id = 47;
    `);

        await queryRunner.query(`
            update transfers set to_account_id = 43 where to_account_id = 47;
    `);

        await queryRunner.query(`
            update expenses set account_id = 43 where account_id = 47;
    `);

        await queryRunner.query(`
            update order_requests set account_id = 43 where account_id = 47;
    `);

        await queryRunner.query(`
           update accounts set active = -1 where id = 47;
    `);

        await queryRunner.query(`
           update accounts set is_supplier = 1 where id = 43;
    `);

        await queryRunner.query(`
           update accounts set is_client = 1 where id = 61;
    `);

        await queryRunner.query(`
           update accounts set is_supplier = 1 where id = 4;
    `);

        await queryRunner.query(`
            update transfers set from_account_id = 92 where from_account_id = 132;
    `);

        await queryRunner.query(`
            update transfers set to_account_id = 92 where to_account_id = 132;
    `);

        await queryRunner.query(`
            update expenses set account_id = 92 where account_id = 132;
    `);

        await queryRunner.query(`
            update order_requests set account_id = 92 where account_id = 132;
    `);

        await queryRunner.query(`
           update accounts set active = -1 where id = 132;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
