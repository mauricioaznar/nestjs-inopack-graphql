import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEquipmentPhotosTable1628111075002
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
          CREATE TABLE \`equipment_photos\`
          (
              \`id\`           int unsigned                                            NOT NULL AUTO_INCREMENT,
              \`active\`       int                                                     NOT NULL DEFAULT '1',
              \`created_at\`   timestamp                                               NULL     DEFAULT NULL,
              \`updated_at\`   timestamp                                               NULL     DEFAULT NULL,
              \`equipment_id\` int unsigned                                                     DEFAULT NULL,
              \`size\`         int unsigned                                                     DEFAULT 0,
              \`name\`         varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
              PRIMARY KEY (\`id\`),
              KEY \`equipment_equipment_photo_id_foreign\` (\`equipment_id\`),
              CONSTRAINT \`equipment_equipment_photo_id_foreign\` FOREIGN KEY (\`equipment_id\`) REFERENCES \`equipments\` (\`id\`)
          ) ENGINE = InnoDB
            AUTO_INCREMENT = 1
            DEFAULT CHARSET = utf8
            COLLATE = utf8_unicode_ci;
      `,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
