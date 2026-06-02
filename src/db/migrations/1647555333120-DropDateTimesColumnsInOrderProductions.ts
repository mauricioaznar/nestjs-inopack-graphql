import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropDateTimesColumnsInOrderProductions1647555333120
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table order_productions drop column end_date_time;`,
    );
    await queryRunner.query(
      `alter table order_productions drop column start_date_time;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
