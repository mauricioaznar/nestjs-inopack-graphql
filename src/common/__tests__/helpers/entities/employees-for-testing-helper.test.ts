import { setupApp } from '../setup-app';
import { INestApplication } from '@nestjs/common';
import { EmployeesService } from '../../../../modules/production/employees/employees.service';
import { createEmployeeForTesting } from './employees-for-testing-helper';
import { orderProductionType1, orderProductionType2 } from '../../objects';
import {
    employeeStatus1,
    employeeStatus2,
} from '../../objects/maintenance/employee-statuses';
import { branch1, branch2 } from '../../objects/maintenance/branches';

let app: INestApplication;

beforeAll(async () => {
    app = await setupApp();
});

afterAll(async () => {
    await app.close();
});

it('create employee for testing works and its default values', async () => {
    const employee = await createEmployeeForTesting({
        app,
    });

    expect(employee).toBeDefined();
    expect(employee?.order_production_type_id).toBe(orderProductionType1.id);
    expect(employee?.employee_status_id).toBe(employeeStatus1.id);
    expect(employee?.branch_id).toBe(branch1.id);
});

it('create employee for testing works and its default values changed', async () => {
    const employee = await createEmployeeForTesting({
        app,
        order_production_type_id: orderProductionType2.id,
        employee_status_id: employeeStatus2.id,
        branch_id: branch2.id,
    });

    expect(employee).toBeDefined();
    expect(employee?.order_production_type_id).toBe(orderProductionType2.id);
    expect(employee?.employee_status_id).toBe(employeeStatus2.id);
    expect(employee?.branch_id).toBe(branch2.id);
});
``;
