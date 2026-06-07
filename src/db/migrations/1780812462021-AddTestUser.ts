import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTestUser1780812462021 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`users\`
        (first_name, last_name, email, password, active, fullname, role_id)
      VALUES
        ('Test', 'Stage', 'test@stage.com', '$2b$10$XVGsitEQx7DBlmfMXnP4ZOV2f2dUbrGE8/Msrsl6DDaq10tZDvMX.', 1, 'Test Stage', 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DELETE FROM `users` WHERE email = 'test@stage.com'",
    );
  }
}
