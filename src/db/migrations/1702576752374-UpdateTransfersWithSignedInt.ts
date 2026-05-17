import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTransfersWithSignedInt1702576752374
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE transfers MODIFY amount double(12 ,2) signed NOT NULL;
      `);

    await queryRunner.query(`
        ALTER TABLE transfer_receipts MODIFY amount double(12 ,2) signed NOT NULL;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
