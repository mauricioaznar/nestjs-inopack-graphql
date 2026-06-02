import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateClientContactsDefaultValues1619144345728
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `client_contacts` ALTER `email` SET DEFAULT '';",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
