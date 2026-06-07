import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTestUser1780812462021 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`users\`
        (first_name, last_name, email, password, active, fullname, role_id)
      VALUES
        ('TEST', 'USER', 'test@stage.com', '$2b$10$9FDPPaVi4APwRXQjVWG0UOV.VSPiZcwNyjkLaqmqL2EWMKKnRXw7.', 1, 'TEST USER', 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DELETE FROM `users` WHERE email = 'test@stage.com'",
    );
  }
}
