import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductMaterialsAndProductCategoriesTables1668704548873
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
          CREATE TABLE \`product_materials\`
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
      `
          CREATE TABLE \`product_categories\`
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
      'ALTER TABLE products ADD `product_material_id` int unsigned DEFAULT NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE products ADD CONSTRAINT product_material_id FOREIGN KEY (product_material_id) REFERENCES product_materials(id);',
    );

    await queryRunner.query(
      'ALTER TABLE products ADD `product_category_id` int unsigned DEFAULT NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE products ADD CONSTRAINT product_category_id FOREIGN KEY (product_category_id) REFERENCES product_categories(id);',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
