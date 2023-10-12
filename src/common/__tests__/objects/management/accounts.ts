import { Account } from '../../../dto/entities';
export const ownAccount: Account = {
    id: 1,
    name: 'Cuenta propia',
    abbreviation: '',
    is_supplier: false,
    is_client: false,
    is_own: true,
};

export const clientAccount: Account = {
    id: 2,
    name: 'Cliente',
    abbreviation: '',
    is_supplier: false,
    is_client: true,
    is_own: false,
};

export const supplierAccount: Account = {
    id: 3,
    name: 'Proveedor',
    abbreviation: '',
    is_supplier: true,
    is_client: false,
    is_own: false,
};

export const accounts: Account[] = [ownAccount, clientAccount, supplierAccount];
