import { AccountType, Branch } from '../../../dto/entities';

export const ownAccountType: AccountType = {
    id: 1,
    name: 'Cuenta propia',
};

export const clientAccountType: Branch = {
    id: 2,
    name: 'Cliente',
};

export const supplierAccountType: Branch = {
    id: 3,
    name: 'Proveedor',
};

export const accountTypes: AccountType[] = [
    ownAccountType,
    clientAccountType,
    supplierAccountType,
];
