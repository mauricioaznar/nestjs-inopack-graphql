import { INestApplication } from '@nestjs/common';
import { setupApp } from '../../../common/__tests__/helpers/setup-app';
import { EmployeesService } from './employees.service';
import {
    employeeStatus1,
    employeeStatus2,
} from '../../../common/__tests__/objects/maintenance/employee-statuses';
import {
    orderProductionType1,
    orderProductionType2,
} from '../../../common/__tests__/objects';
import {
    branch1,
    branch2,
} from '../../../common/__tests__/objects/maintenance/branches';

let app: INestApplication;
let employeesService: EmployeesService;

beforeAll(async () => {
    app = await setupApp();
    employeesService = app.get(EmployeesService);
});

afterAll(async () => {
    await app.close();
});

describe('Returns employee list', () => {
    it('returns employees', async () => {
        const employeeList = await employeesService.getEmployees();

        expect(Array.isArray(employeeList)).toBe(true);
    });
});

describe('Upsert employee', () => {
    it('creates employee', async () => {
        const employee = await employeesService.upsertEmployee({
            employee_status_id: employeeStatus1.id,
            order_production_type_id: orderProductionType1.id,
            branch_id: branch1.id,
            first_name: 'First name',
            last_name: 'Last name',
        });

        expect(employee.id).toBeDefined();
        expect(employee.employee_status_id).toBe(employeeStatus1.id);
        expect(employee.order_production_type_id).toBe(orderProductionType1.id);
        expect(employee.branch_id).toBe(branch1.id);
        expect(employee.first_name).toEqual(expect.stringMatching(/first/i));
        expect(employee.last_name).toEqual(expect.stringMatching(/last/i));
        expect(employee.fullname).toEqual(
            expect.stringMatching(/first name last/i),
        );
    });

    it('updates employee', async () => {
        const createdEmployee = await employeesService.upsertEmployee({
            employee_status_id: employeeStatus1.id,
            order_production_type_id: orderProductionType1.id,
            branch_id: branch1.id,
            first_name: 'First name',
            last_name: 'Last name',
        });

        const updatedEmployee = await employeesService.upsertEmployee({
            id: createdEmployee.id,
            employee_status_id: employeeStatus2.id,
            order_production_type_id: orderProductionType1.id,
            branch_id: branch2.id,
            first_name: 'First name 2',
            last_name: 'Last name 2',
        });

        expect(updatedEmployee.id).toBeDefined();
        expect(createdEmployee.id).toEqual(updatedEmployee.id);
        expect(updatedEmployee.employee_status_id).toBe(employeeStatus2.id);
        expect(updatedEmployee.order_production_type_id).toBe(
            orderProductionType1.id,
        );
        expect(updatedEmployee.branch_id).toBe(branch2.id);
        expect(updatedEmployee.first_name).toEqual(
            expect.stringMatching(/first name 2/i),
        );
        expect(updatedEmployee.last_name).toEqual(
            expect.stringMatching(/last name 2/i),
        );
        expect(updatedEmployee.fullname).toEqual(
            expect.stringMatching(/first name 2 last name/i),
        );
    });

    it('doesnt updaed if order_production_type_id changes', async () => {
        const createdEmployee = await employeesService.upsertEmployee({
            employee_status_id: employeeStatus1.id,
            order_production_type_id: orderProductionType1.id,
            branch_id: branch1.id,
            first_name: 'First name',
            last_name: 'Last name',
        });

        try {
            const updatedEmployee = await employeesService.upsertEmployee({
                id: createdEmployee.id,
                employee_status_id: employeeStatus2.id,
                order_production_type_id: orderProductionType2.id,
                branch_id: branch2.id,
                first_name: 'First name 2',
                last_name: 'Last name 2',
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/order_production_type cant change/i),
                ]),
            );
        }
    });
});

describe('gets employee', () => {
    it('returns employee', async () => {
        const createdEmployee = await employeesService.upsertEmployee({
            employee_status_id: employeeStatus1.id,
            order_production_type_id: orderProductionType1.id,
            branch_id: branch1.id,
            first_name: 'First name',
            last_name: 'Last name',
        });

        const employee = await employeesService.getEmployee({
            employeeId: createdEmployee.id,
        });

        expect(employee?.id).toBeDefined();
        expect(employee?.id).toEqual(createdEmployee.id);
    });
});

describe('deletes employee', () => {
    it('deletes employee and get returns null', async () => {
        const createdEmployee = await employeesService.upsertEmployee({
            employee_status_id: employeeStatus1.id,
            order_production_type_id: orderProductionType1.id,
            branch_id: branch1.id,
            first_name: 'First name',
            last_name: 'Last name',
        });

        await employeesService.deletesEmployee({
            employee_id: createdEmployee.id,
        });

        const employee = await employeesService.getEmployee({
            employeeId: createdEmployee.id,
        });

        expect(employee).toBeFalsy();
    });
});
