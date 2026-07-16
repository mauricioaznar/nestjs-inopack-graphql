import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductTypeCategoriesTable1646421593639
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
          CREATE TABLE \`product_type_categories\`
          (
              \`id\`           int unsigned                                            NOT NULL AUTO_INCREMENT,
              \`active\`       int                                                     NOT NULL DEFAULT '1',
              \`created_at\`   timestamp                                               NULL     DEFAULT NULL,
              \`updated_at\`   timestamp                                               NULL     DEFAULT NULL,
              \`name\`         varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
              PRIMARY KEY (\`id\`)
          ) ENGINE = InnoDB
            AUTO_INCREMENT = 1
            DEFAULT CHARSET = utf8
            COLLATE = utf8_unicode_ci;
      `,
        );

        await queryRunner.query(
            'ALTER TABLE product_type ADD `product_type_category_id` int unsigned DEFAULT NULL;',
        );
        await queryRunner.query(
            'ALTER TABLE product_type ADD CONSTRAINT product_type_product_type_category_id_foreign FOREIGN KEY (product_type_category_id) REFERENCES product_type_categories(id);',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
