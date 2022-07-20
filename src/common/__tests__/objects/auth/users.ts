import { CreateUserInput } from '../../../dto/entities';
import { role1, role2 } from './roles';

export const adminUser: CreateUserInput = {
    email: 'john@example',
    password: 'changeme',
    first_name: 'first name',
    last_name: 'last name',
    roles: [role1, role2],
};
