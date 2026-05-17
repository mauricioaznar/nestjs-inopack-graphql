import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTransfersWithTransferType1713545064780
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
              CREATE TABLE \`transfer_type\` (
                \`id\` int unsigned NOT NULL AUTO_INCREMENT,
                \`active\`     int       NOT NULL DEFAULT '1',
                \`created_at\` datetime NULL     DEFAULT NULL,
                \`updated_at\` datetime NULL     DEFAULT NULL,
                \`name\` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
                \`description\` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL,
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
            `);

    await queryRunner.query(`
            ALTER TABLE \`transfers\` 
                ADD COLUMN \`transfer_type_id\` int unsigned DEFAULT null, 
                ADD CONSTRAINT \`transfers_transfer_type_id_foreign\` FOREIGN KEY (\`transfer_type_id\`) 
                REFERENCES \`transfer_type\`(\`id\`);
        `);

    await queryRunner.query(`
            INSERT INTO \`transfer_type\` (name, description) VALUES ('Transferencia entre cuentas propias', '');
        `);

    await queryRunner.query(`
            INSERT INTO \`transfer_type\` (name, description) VALUES ('Cobranza', '');
        `);

    await queryRunner.query(`
            INSERT INTO \`transfer_type\` (name, description) VALUES ('Pago', '');
        `);

    await queryRunner.query(`
            INSERT INTO \`transfer_type\` (name, description) VALUES ('Ajuste', '');
        `);

    await queryRunner.query(`
            update transfers set transfer_type_id = 1 where from_account_id in (36, 37, 38, 39) and to_account_id in (36, 37, 38, 39);
        `);

    await queryRunner.query(`
            update transfers set transfer_type_id = 2 where from_account_id not in (36, 37, 38, 39) and to_account_id in (36, 37, 38, 39);
        `);

    await queryRunner.query(`
            update transfers set transfer_type_id = 3 where from_account_id in (36, 37, 38, 39) and to_account_id not in (36, 37, 38, 39);
        `);

    await queryRunner.query(`
            update transfers set transfer_type_id = 4 where isnull(from_account_id) or isnull(to_account_id);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
