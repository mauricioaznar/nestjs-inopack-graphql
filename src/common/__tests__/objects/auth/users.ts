import { CreateUserInput } from '../../../dto/entities';
import { superRole, adminRole, salesRole } from './roles';

export const adminUser: CreateUserInput & { id: number } = {
    id: 1,
    email: 'john@example',
    password: 'changeme',
    first_name: 'first name',
    last_name: 'last name',
    roles: [superRole, adminRole],
};

export const salesUser: CreateUserInput & { id: number } = {
    id: 2,
    email: 'sales@example',
    password: 'changeme',
    first_name: 'first name',
    last_name: 'last name',
    roles: [salesRole],
};
