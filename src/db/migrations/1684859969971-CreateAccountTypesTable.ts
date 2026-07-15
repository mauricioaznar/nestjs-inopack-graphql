import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountTypesTable1684859969971
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
              CREATE TABLE \`account_types\` (
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
                ADD COLUMN \`account_type_id\` int unsigned, 
                ADD CONSTRAINT \`accounts_account_type_id_foreign\` FOREIGN KEY (\`account_type_id\`) 
                REFERENCES \`account_types\`(\`id\`);
        `);

        await queryRunner.query(`
        insert into account_types (active, name) values (1, 'Cuenta propia');
    `);

        await queryRunner.query(`
        insert into account_types (active, name) values (1, 'Cliente');
    `);

        await queryRunner.query(`
        insert into account_types (active, name) values (1, 'Proveedor');
    `);

        await queryRunner.query(
            `update accounts set account_type_id = 2 where id >= 1;`,
        );

        await queryRunner.query(`
        insert into accounts (active, name, abbreviation, account_type_id) values (1, 'Inopack cibanco', 'Cibanco', 1);
    `);

        await queryRunner.query(`
        insert into accounts (active, name, abbreviation, account_type_id) values (1, 'Inopack banorte', 'Banorte', 1);
    `);

        await queryRunner.query(`
        insert into accounts (active, name, abbreviation, account_type_id) values (1, 'Inopack efectivo', 'Efectivo', 1);
    `);

        await queryRunner.query(`
        insert into accounts (active, name, abbreviation, account_type_id) values (1, 'Inopack bancomer', 'Bancomer', 1);
    `);

        await queryRunner.query(`
        insert into accounts (active, name, abbreviation, account_type_id) values (1, 'Comision federal de electicidad', 'CFE', 3);
    `);

        await queryRunner.query(`
        insert into accounts (active, name, abbreviation, account_type_id) values (1, 'Claudia Rivas', 'Claudia', 3);
    `);

        await queryRunner.query(`
        insert into accounts (active, name, abbreviation, account_type_id) values (1, 'Bepensa', 'Bepensa', 3);
    `);

        await queryRunner.query(`
            ALTER TABLE \`expenses\` 
                ADD COLUMN \`account_id\` int unsigned, 
                ADD CONSTRAINT \`expenses_account_id_foreign\` FOREIGN KEY (\`account_id\`) 
                REFERENCES \`accounts\`(\`id\`);
        `);

        await queryRunner.query(`
              CREATE TABLE \`resources\` (
                \`id\` int unsigned NOT NULL AUTO_INCREMENT,
                \`active\`     int       NOT NULL DEFAULT '1',
                \`created_at\` datetime NULL     DEFAULT NULL,
                \`updated_at\` datetime NULL     DEFAULT NULL,
                \`name\` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
            `);

        await queryRunner.query(`
            ALTER TABLE \`expense_resources\` 
                ADD COLUMN \`resource_id\` int unsigned, 
                ADD CONSTRAINT \`expense_resources_resource_id_foreign\` FOREIGN KEY (\`resource_id\`) 
                REFERENCES \`resources\`(\`id\`);
        `);

        await queryRunner.query(`
              CREATE TABLE \`resource_categories\` (
                \`id\` int unsigned NOT NULL AUTO_INCREMENT,
                \`active\`     int       NOT NULL DEFAULT '1',
                \`created_at\` datetime NULL     DEFAULT NULL,
                \`updated_at\` datetime NULL     DEFAULT NULL,
                \`name\` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
            `);

        await queryRunner.query(`
            ALTER TABLE \`resources\` 
                ADD COLUMN \`resource_category_id\` int unsigned, 
                ADD CONSTRAINT \`resources_resource_category_id_foreign\` FOREIGN KEY (\`resource_category_id\`) 
                REFERENCES \`resource_categories\`(\`id\`);
        `);

        await queryRunner.query(`
            INSERT INTO \`resource_categories\` (id, name) VALUES (1, 'Administrativo');
        `);

        await queryRunner.query(`
            INSERT INTO \`resource_categories\` (id, name) VALUES (2, 'Refacciones');
        `);

        await queryRunner.query(`
            INSERT INTO \`resource_categories\` (id, name) VALUES (3, 'Transporte');
        `);

        await queryRunner.query(`
            INSERT INTO \`resource_categories\` (id, name) VALUES (4, 'Materia prima');
        `);

        // 1 Administrativo

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Energia electrica', 1);
        `);

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Credito', 1);
        `);

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Impuestos', 1);
        `);

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Renta de establecimiento', 1);
        `);

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Renta de maquinaria', 1);
        `);

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Contadores', 1);
        `);

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Rembolsos', 1);
        `);

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Compra de maquinaria', 1);
        `);

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Seguridad', 1);
        `);

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Compresores', 1);
        `);

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Localizadores', 1);
        `);

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Tornero', 1);
        `);

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Filtros de agua', 1);
        `);

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Prestamos', 1);
        `);

        // 2 Refacciones

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Baleros', 2);
        `);

        // 3 Transporte

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Gasolina', 3);
        `);

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Flete', 3);
        `);

        // 4 Materia Prima

        await queryRunner.query(`
            INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Greña', 4);
        `);

        await queryRunner.query(`
           INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Pellet', 4);
        `);

        await queryRunner.query(`
           INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Empaque', 4);
        `);

        await queryRunner.query(`
           INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Carbonato', 4);
        `);

        await queryRunner.query(`
           INSERT INTO \`resources\` (name, resource_category_id) VALUES ('Pigmento', 4);
        `);

        // Expenses

        //cfe 39, 40 claudia, 41 bepensa

        await queryRunner.query(`
           INSERT INTO \`expenses\` (\`date\`, \`locked\`, \`account_id\`) VALUES ("2023-05-29", false, 39);
        `);

        await queryRunner.query(`
           INSERT INTO \`expense_resources\` (\`amount\`, \`expense_id\`, \`resource_id\`) VALUES (500000, 1, 1);
        `);

        await queryRunner.query(`
           INSERT INTO \`expense_resources\` (\`amount\`, \`expense_id\`, \`resource_id\`) VALUES (500000, 1, 1);
        `);

        await queryRunner.query(`
              CREATE TABLE \`transfer_receipts\` (
                \`id\` int unsigned NOT NULL AUTO_INCREMENT,
                \`active\`     int       NOT NULL DEFAULT '1',
                \`created_at\` datetime NULL     DEFAULT NULL,
                \`updated_at\` datetime NULL     DEFAULT NULL,
                \`amount\` double(12 ,2) unsigned NOT NULL,
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
            `);

        await queryRunner.query(`
            ALTER TABLE \`transfer_receipts\`
                ADD COLUMN \`order_sale_id\` int unsigned,
                ADD CONSTRAINT \`transfer_receipts_order_sale_id_foreign\` FOREIGN KEY (\`order_sale_id\`)
                REFERENCES \`order_sales\`(\`id\`);
        `);

        await queryRunner.query(`
            ALTER TABLE \`transfer_receipts\`
                ADD COLUMN \`expense_id\` int unsigned,
                ADD CONSTRAINT \`transfer_receipts_expense_id_foreign\` FOREIGN KEY (\`expense_id\`)
                REFERENCES \`expenses\`(\`id\`);
        `);

        await queryRunner.query(`
            ALTER TABLE \`transfer_receipts\`
                ADD COLUMN \`transfer_id\` int unsigned,
                ADD CONSTRAINT \`transfer_receipts_transfer_id_foreign\` FOREIGN KEY (\`transfer_id\`)
                REFERENCES \`transfers\`(\`id\`);
        `);

        /*
insert into transfers (order_sale_id, amount, from_account_id, transferred_date) SELECT
	ctv.order_sale_id,
    if (order_sales.order_sale_receipt_type_id = 2, ctv.total * 1.16, ctv.total) as amount,
    order_requests.account_id as from_account_id,
    order_sales.date as transferred_date
FROM (
	SELECT dtv.order_sale_id, sum(dtv.total) as total
    FROM
	(
		SELECT
		order_sale_products.order_sale_id as order_sale_id,
		order_sale_products.kilos,
		order_sale_products.kilo_price,
		order_sale_products.kilos * order_sale_products.kilo_price as total
		FROM inopack.order_sales
		join order_sale_products
		on order_sale_products.order_sale_id = order_sales.id
		join order_requests
		on order_sales.order_request_id = order_requests.id
		where order_sales.active = 1
		and order_sale_products.active = 1
		and order_requests.active = 1
	) as dtv
group by dtv.order_sale_id
) as ctv
join order_sales
on order_sales.id = ctv.order_sale_id
join order_requests
on order_requests.id = order_sales.order_request_id
     */

        /*
      UPDATE
    `transfers`,
    (
        SELECT MAX(order_sale_payments.date_paid) as date, order_sale_payments.order_sale_id FROM inopack.order_sale_payments group by order_sale_payments.order_sale_id
    ) AS `src`
SET
    `transfers`.`transferred_date` = `src`.`date`
WHERE
    `transfers`.`order_sale_id` = `src`.`order_sale_id`
;
       */
        await queryRunner.query(`
            ALTER TABLE \`expense_resources\`
                ADD COLUMN \`branch_id\` int unsigned,
                ADD CONSTRAINT \`transfer_receipts_branch_id_foreign\` FOREIGN KEY (\`branch_id\`)
                REFERENCES \`branches\`(\`id\`);
        `);

        await queryRunner.query(`
            ALTER TABLE \`transfers\`
                ADD COLUMN \`order_sale_id\` int unsigned,
                ADD CONSTRAINT \`transfer_order_sale_id_foreign\` FOREIGN KEY (\`order_sale_id\`)
                REFERENCES \`order_sales\`(\`id\`);
        `);

        await queryRunner.query(`
insert into transfers (order_sale_id, amount, from_account_id, transferred_date, to_account_id)
        SELECT
            ctv.order_sale_id,
            ctv.total as amount,
            order_requests.account_id as from_account_id,
            order_sales.date as transferred_date,
            if (order_sales.order_sale_receipt_type_id = 2, 37, 38) as to_account_id
        FROM (
                SELECT dtv.order_sale_id as order_sale_id, round(sum(dtv.total_with_tax), 2) as total
                FROM
                  (
             select 
                 date (date_add(order_sales.date, interval -WEEKDAY(order_sales.date) - 1 day)) first_day_of_the_week,
                 date(date_add(date_add(order_sales.date, interval -WEEKDAY(order_sales.date) - 1 day), interval 6 day)) last_day_of_the_week,
                 order_sales.date start_date,
                 order_sales.id as order_sale_id,
                 products.id product_id,
                 products.description product_name,
                 products.order_production_type_id order_production_type_id,
                 order_production_type.name order_production_type_name,
                 product_categories.id product_category_id,
                 product_categories.name product_category_name,
                 accounts.id account_id,
                 accounts.name account_name,
                 accounts.abbreviation account_abbreviation,
                 order_sale_receipt_type.id receipt_type_id,
                 order_sale_receipt_type.name receipt_type_name,
                 order_sale_statuses.id status_id,
                 order_sale_statuses.name status_name,
                 order_sale_products.kilos kilos_sold,
                 order_sale_products.kilo_price kilo_price,
                 ((order_sale_products.kilos * order_sale_products.kilo_price) -(order_sale_products.kilos * order_sale_products.kilo_price * order_sale_products.discount / 100)) total,
                 ((order_sale_products.kilos * order_sale_products.kilo_price) - (order_sale_products.kilos * order_sale_products.kilo_price * order_sale_products.discount / 100)) *
                 if(order_sales.order_sale_receipt_type_id = 2, 0.16, 0)    tax,
                 ((order_sale_products.kilos * order_sale_products.kilo_price) - (order_sale_products.kilos * order_sale_products.kilo_price * order_sale_products.discount / 100)) *
                 if(order_sales.order_sale_receipt_type_id = 2, 1.16, 1)    total_with_tax
            from order_sales
                join order_sale_products
                on order_sale_products.order_sale_id = order_sales.id
                left join order_requests
                on order_requests.id = order_sales.order_request_id
                left join products
                on order_sale_products.product_id = products.id
                left join order_production_type
                on order_production_type.id = products.order_production_type_id
                left join product_categories
                on products.product_category_id = product_categories.id
                left join accounts
                on accounts.id = order_requests.account_id
                left join order_sale_statuses
                on order_sale_statuses.id = order_sales.order_sale_status_id
                left join order_sale_receipt_type
                on order_sale_receipt_type.id = order_sales.order_sale_receipt_type_id
            where order_sale_products.active = 1
              and order_sales.active = 1
                )  as dtv
              group by dtv.order_sale_id
              ) as ctv
              join order_sales
              on order_sales.id = ctv.order_sale_id
              join order_requests
              on order_requests.id = order_sales.order_request_id
    `);

        await queryRunner.query(`
         UPDATE
            \`transfers\`,
            (
                SELECT MAX(order_sale_payments.date_paid) as date, order_sale_payments.order_sale_id FROM inopack.order_sale_payments group by order_sale_payments.order_sale_id
            ) AS \`src\`
            SET
            \`transfers\`.\`transferred_date\` = \`src\`.\`date\`
            WHERE
            \`transfers\`.\`order_sale_id\` = \`src\`.\`order_sale_id\`
    `);

        await queryRunner.query(`
      insert into transfer_receipts (order_sale_id, transfer_id, amount)   select transfers.order_sale_id, transfers.id as transfer_id, transfers.amount FROM inopack.transfers;
    `);

        await queryRunner.query(`
          ALTER TABLE transfers DROP FOREIGN KEY transfer_order_sale_id_foreign;
      `);

        await queryRunner.query(
            `alter table transfers drop column order_sale_id;`,
        );

        await queryRunner.query(
            `alter table order_sales add column \`expected_payment_date\` datetime DEFAULT NULL;`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
