import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderProductionResourcesTable1753284496021
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
          CREATE TABLE \`order_production_resources\`
          (
              \`id\`           int unsigned                                            NOT NULL AUTO_INCREMENT,
              \`active\`       int                                                     NOT NULL DEFAULT '1',
              \`created_at\` datetime NULL     DEFAULT NULL,
              \`updated_at\` datetime NULL     DEFAULT NULL,
              \`kilos\` double(8, 2) NOT NULL,
              \`groups\` double(8,2) DEFAULT NULL,
              \`group_weight\` double(8,2) DEFAULT NULL,
              \`product_id\` int unsigned DEFAULT NULL,
              \`order_production_id\` int unsigned DEFAULT NULL,
              \`machine_id\` int unsigned DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              KEY \`order_production_resources_product_id_foreign\` (\`product_id\`),
              KEY \`order_production_resources_order_production_id_foreign\` (\`order_production_id\`),
              KEY \`order_production_resources_machine_id_foreign\` (\`machine_id\`),
              CONSTRAINT \`order_production_resources_order_production_id_foreign\` FOREIGN KEY (\`order_production_id\`) REFERENCES \`order_productions\` (\`id\`),
              CONSTRAINT \`order_production_resources_product_id_foreign\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`),
              CONSTRAINT \`order_production_resources_machine_id_foreign\` FOREIGN KEY (\`machine_id\`) REFERENCES \`machines\` (\`id\`)
          ) ENGINE = InnoDB
            AUTO_INCREMENT = 1
            DEFAULT CHARSET = utf8
            COLLATE = utf8_unicode_ci;
      `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
