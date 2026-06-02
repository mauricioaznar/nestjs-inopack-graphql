import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropOrderReturnTables1642357838685 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            drop table order_returns;
        `);

    await queryRunner.query(`
            drop table order_return_type;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
