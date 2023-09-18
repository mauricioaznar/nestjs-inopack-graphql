import { Account } from '../../../dto/entities';
import {
    clientAccountType,
    ownAccountType,
    supplierAccountType,
} from './account-types';

export const ownAccount: Account = {
    id: 1,
    name: 'Cuenta propia',
    abbreviation: '',
    account_type_id: ownAccountType.id,
    is_supplier: false,
    is_client: false,
    is_own: true,
};

export const clientAccount: Account = {
    id: 2,
    name: 'Cliente',
    abbreviation: '',
    account_type_id: clientAccountType.id,
    is_supplier: false,
    is_client: true,
    is_own: false,
};

export const supplierAccount: Account = {
    id: 3,
    name: 'Proveedor',
    abbreviation: '',
    account_type_id: supplierAccountType.id,
    is_supplier: true,
    is_client: false,
    is_own: false,
};

export const accounts: Account[] = [ownAccount, clientAccount, supplierAccount];
