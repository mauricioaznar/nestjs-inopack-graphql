import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPasswordResets1621564278269 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE password_resets');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
