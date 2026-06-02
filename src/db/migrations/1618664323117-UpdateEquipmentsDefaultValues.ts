import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEquipmentsDefaultValues1618664323117
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `equipments` ALTER `image_name` SET DEFAULT '';",
    );
    await queryRunner.query(
      "ALTER TABLE `equipments` ALTER `name` SET DEFAULT '';",
    );
    await queryRunner.query(
      "ALTER TABLE `equipments` ALTER `description` SET DEFAULT '';",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
