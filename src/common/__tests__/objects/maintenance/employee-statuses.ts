import { EmployeeStatus } from '../../../dto/entities/production/employee-status.dto';

export const employeeStatus1: EmployeeStatus = {
    id: 1,
    name: 'Alta',
};

export const employeeStatus2: EmployeeStatus = {
    id: 2,
    name: 'Baja',
};

export const employeeStatuses: EmployeeStatus[] = [
    employeeStatus1,
    employeeStatus2,
];
