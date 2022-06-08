import { Employee } from '../../../dto/entities/production/employee.dto';
import { EmployeesService } from '../../../../modules/entities/production/employees/employees.service';
import { branch1 } from '../../objects/maintenance/branches';
import { orderProductionType1 } from '../../objects';
import { employeeStatus1 } from '../../objects/maintenance/employee-statuses';

export async function createEmployeeForTesting({
    employeesService,
    branch_id = branch1.id,
    order_production_type_id = orderProductionType1.id,
    employee_status_id = employeeStatus1.id,
}: {
    employeesService: EmployeesService;
    branch_id?: number;
    order_production_type_id?: number;
    employee_status_id?: number;
}): Promise<Employee> {
    try {
        return await employeesService.upsertEmployee({
            branch_id,
            employee_status_id,
            order_production_type_id,
            last_name: 'Employee last name',
            first_name: 'Employee first name',
        });
    } catch (e) {
        console.error(e);
    }

    throw new Error('createEmployeeForTesting failed');
}
