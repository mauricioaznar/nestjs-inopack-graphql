import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanAccountRepeatedSuppliersOne1714602444819
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.fromTo(queryRunner, 67, 153);
        await this.fromTo(queryRunner, 23, 48);
        await this.fromTo(queryRunner, 83, 161);
        await this.fromTo(queryRunner, 175, 213);
        await this.fromTo(queryRunner, 141, 41);
        await this.fromTo(queryRunner, 113, 104);
        await this.fromTo(queryRunner, 191, 151);
        await this.fromTo(queryRunner, 86, 170);
        await this.fromTo(queryRunner, 66, 100);
    }

    private async fromTo(queryRunner: QueryRunner, from: number, to: number) {
        await queryRunner.query(`
            update transfers set from_account_id = ${to} where from_account_id = ${from};
    `);

        await queryRunner.query(`
            update transfers set to_account_id = ${to} where to_account_id = ${from};
    `);

        await queryRunner.query(`
            update expenses set account_id = ${to} where account_id = ${from};
    `);

        await queryRunner.query(`
            update order_requests set account_id = ${to} where account_id = ${from};
    `);

        await queryRunner.query(`
            update order_sales set account_id = ${to} where account_id = ${from};
    `);

        await queryRunner.query(`
            update account_contacts set account_id = ${to} where account_id = ${from};
    `);

        await queryRunner.query(`
            update raw_material_additions set account_id = ${to} where account_id = ${from};
    `);

        await queryRunner.query(`
           update accounts set active = -1 where id = ${from};
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
