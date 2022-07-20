import { Role } from '../../../dto/entities/auth/role.dto';

export const role1: Role = {
    id: 1,
    name: 'Super',
};

export const role2: Role = {
    id: 2,
    name: 'Admin',
};

export const role3: Role = {
    id: 3,
    name: 'Guest',
};

export const role4: Role = {
    id: 4,
    name: 'Production',
};

export const role5: Role = {
    id: 5,
    name: 'Sales',
};

export const roles: Role[] = [role1, role2, role3, role4, role5];
