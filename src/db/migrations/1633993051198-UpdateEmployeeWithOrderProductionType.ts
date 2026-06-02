import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEmployeeWithOrderProductionType1633993051198
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE employees ADD `order_production_type_id` int unsigned DEFAULT NULL;',
    );
    await queryRunner.query(
      'ALTER TABLE employees ADD CONSTRAINT employees_order_production_type_id_foreign FOREIGN KEY (order_production_type_id) REFERENCES order_production_type(id);',
    );
    await queryRunner.query(
      'update employees set order_production_type_id = 1 where employee_type_id = 1;',
    );
    await queryRunner.query(
      'update employees set order_production_type_id = 1 where employee_type_id = 4;',
    );
    await queryRunner.query(
      'update employees set order_production_type_id = 2 where employee_type_id = 2;',
    );
    await queryRunner.query(
      'update employees set order_production_type_id = 3 where employee_type_id = 6;',
    );
    await queryRunner.query(
      'update employees set order_production_type_id = 4 where employee_type_id = 7;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
