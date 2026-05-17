import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExpenseResources1764105039622 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
          CREATE TABLE \`expense_resources\`
          (
              \`id\`           int unsigned                                            NOT NULL AUTO_INCREMENT,
              \`active\`       int                                                     NOT NULL DEFAULT '1',
              \`created_at\` datetime NULL     DEFAULT NULL,
              \`updated_at\` datetime NULL     DEFAULT NULL,
              \`units\` double(8, 2) NOT NULL,
              \`unit_price\` double(8,2) DEFAULT NULL,
              \`resource_id\` int unsigned DEFAULT NULL,
              \`expense_id\` int unsigned DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              KEY \`expense_resources_resource_id_foreign\` (\`resource_id\`),
              KEY \`expense_resources_expense_id_foreign\` (\`expense_id\`),
              CONSTRAINT \`expense_resources_resource_id_foreign\` FOREIGN KEY (\`resource_id\`) REFERENCES \`resources\` (\`id\`),
              CONSTRAINT \`expense_resources_expense_id_foreign\` FOREIGN KEY (\`expense_id\`) REFERENCES \`expenses\` (\`id\`)
          ) ENGINE = InnoDB
            AUTO_INCREMENT = 1
            DEFAULT CHARSET = utf8
            COLLATE = utf8_unicode_ci;
      `,
    );

    await queryRunner.query(`
                ALTER TABLE \`supplier_type\`
                    ADD COLUMN \`resource_id\` int unsigned default null,
                    ADD CONSTRAINT \`supplier_type_resource_id_foreign\` FOREIGN KEY (\`resource_id\`)
                    REFERENCES \`resources\`(\`id\`);
            `);

    await queryRunner.query(`
                ALTER TABLE \`accounts\`
                    ADD COLUMN \`resource_id\` int unsigned default null,
                    ADD CONSTRAINT \`accounts_resource_id_foreign\` FOREIGN KEY (\`resource_id\`)
                    REFERENCES \`resources\`(\`id\`);
            `);

    await queryRunner.query(`
                ALTER TABLE \`expenses\`
                    ADD COLUMN \`resources_total\` double(8,2) DEFAULT NULL;
            `);

    await queryRunner.query(`
               update expenses set expenses.resources_total = expenses.subtotal where id > 0;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 40 where id = 1;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 9 where id = 2;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 4 where id = 3;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 1 where id = 4;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 6 where id = 5;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 17 where id = 6;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 18 where id = 7;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 20 where id = 8;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 3 where id = 9;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 26 where id = 10;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 5 where id = 11;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 14 where id = 12;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 39 where id = 13;
            `);

    await queryRunner.query(`
                UPDATE resources SET name = 'Otros' where id = 39;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 36 where id = 14;
            `);

    await queryRunner.query(`
                UPDATE resources SET name = 'Nominas efectivo' where id = 36;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 7 where id = 15;
            `);

    await queryRunner.query(`
                UPDATE resources SET name = 'Nominas administrativas' where id = 7;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 31 where id = 16;
            `);

    await queryRunner.query(`
                UPDATE resources SET name = 'Ahorros' where id = 31;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 38 where id = 17;
            `);

    await queryRunner.query(`
                UPDATE resources SET name = 'Nominas Cheques' where id = 38;
            `);

    await queryRunner.query(`
                UPDATE supplier_type SET resource_id = 27 where id = 18;
            `);

    await queryRunner.query(`
                UPDATE resources SET name = 'Inversion' where id = 27;
            `);

    await queryRunner.query(`
            insert into
                    expense_resources (active, units, resource_id, unit_price, expense_id)
                select
                expenses.active,
                1,
                supplier_type.resource_id,
                expenses.subtotal,
                expenses.id
            from expenses
            left join accounts
            on accounts.id = expenses.account_id
            left join supplier_type
            on accounts.supplier_type_id = supplier_type.id
            where expenses.active = 1;
    `);

    await queryRunner.query(`
            update accounts
                inner join supplier_type on supplier_type.id = accounts.supplier_type_id
                set accounts.resource_id = supplier_type.resource_id
    `);

    await queryRunner.query(
      `update products set product_category_id = 10 where id = 128;`,
    );

    await queryRunner.query(
      `update products set product_category_id = 10 where id = 135;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
