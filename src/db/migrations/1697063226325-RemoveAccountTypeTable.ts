import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAccountTypeTable1697063226325 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE accounts DROP FOREIGN KEY accounts_account_type_id_foreign;
    `);

        await queryRunner.query(
            `alter table accounts drop column account_type_id;`,
        );

        await queryRunner.query(`drop table account_types;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
