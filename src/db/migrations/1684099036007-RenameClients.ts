import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameClients1684099036007 implements MigrationInterface {
    /*
    ALTER TABLE table_name
    DROP FOREIGN KEY fk_constraint_name;
    
    ALTER TABLE table_name
    CHANGE fk_column_name new_fk_column_name datatype;
    
    ALTER TABLE table_name
    ADD FOREIGN KEY fk_constraint_name
    REFERENCES parent_table_name(pk_column_name_id);
     */

    public async up(queryRunner: QueryRunner): Promise<void> {
        // change order_requests client_id for account_id
        await queryRunner.query(`
        ALTER TABLE order_requests
        DROP FOREIGN KEY order_requests_client_id_foreign;
    `);

        await queryRunner.query(`
        ALTER TABLE order_requests
        CHANGE client_id account_id int unsigned DEFAULT NULL;
    `);

        await queryRunner.query(`
        ALTER TABLE order_requests
        ADD CONSTRAINT order_requests_account_id_foreign FOREIGN KEY (account_id)
        REFERENCES clients(id);
    `);

        // drop order_requests client_contact_id
        await queryRunner.query(`
        ALTER TABLE order_requests
        DROP FOREIGN KEY order_requests_client_contact_id_foreign;
    `);

        await queryRunner.query(`
       ALTER TABLE order_requests DROP COLUMN client_contact_id;
    `);

        // drop order_sales client_contact_id
        await queryRunner.query(`
        ALTER TABLE order_sales
        DROP FOREIGN KEY order_sales_client_contact_id_foreign;
    `);

        await queryRunner.query(`
       ALTER TABLE order_sales DROP COLUMN client_contact_id;
    `);

        // change client_contacts client_id for account_id
        await queryRunner.query(`
        ALTER TABLE client_contacts
        DROP FOREIGN KEY client_contacts_client_id_foreign;
    `);

        await queryRunner.query(`
        ALTER TABLE client_contacts
        CHANGE client_id account_id int unsigned DEFAULT NULL;
    `);

        await queryRunner.query(`
        ALTER TABLE client_contacts
        ADD CONSTRAINT client_contacts_account_id_foreign FOREIGN KEY (account_id)
        REFERENCES clients(id);
    `);

        await queryRunner.query(`
        ALTER TABLE clients RENAME accounts;
    `);

        await queryRunner.query(`
        ALTER TABLE client_contacts RENAME account_contacts;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
