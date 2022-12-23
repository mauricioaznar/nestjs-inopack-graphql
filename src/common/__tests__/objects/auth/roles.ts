import { Role } from '../../../dto/entities/auth/role.dto';

export const superRole: Role = {
    id: 1,
    name: 'Super',
};

export const adminRole: Role = {
    id: 2,
    name: 'Admin',
};

export const guestRole: Role = {
    id: 3,
    name: 'Guest',
};

export const productionRole: Role = {
    id: 4,
    name: 'Production',
};

export const salesRole: Role = {
    id: 5,
    name: 'Sales',
};

export const roles: Role[] = [
    superRole,
    adminRole,
    guestRole,
    productionRole,
    salesRole,
];
