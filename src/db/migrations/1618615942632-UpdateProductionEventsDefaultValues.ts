import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProductionEventsDefaultValues1618615942632
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `production_events` ALTER `maintenance_employee_description` SET DEFAULT '';",
    );
    await queryRunner.query(
      "ALTER TABLE `production_events` ALTER `report_employee_description` SET DEFAULT '';",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
