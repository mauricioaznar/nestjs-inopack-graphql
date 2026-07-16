import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupplierType1744676018197 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
              CREATE TABLE \`supplier_type\` (
                \`id\` int unsigned NOT NULL AUTO_INCREMENT,
                \`active\`     int       NOT NULL DEFAULT '1',
                \`created_at\` datetime NULL     DEFAULT NULL,
                \`updated_at\` datetime NULL     DEFAULT NULL,
                \`name\` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
            `);

        await queryRunner.query(`
            ALTER TABLE \`accounts\` 
                ADD COLUMN \`supplier_type_id\` int unsigned, 
                ADD CONSTRAINT \`suppliers_supplier_type_id_foreign\` FOREIGN KEY (\`supplier_type_id\`) 
                REFERENCES \`supplier_type\`(\`id\`);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
