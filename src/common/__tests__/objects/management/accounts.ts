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
};

export const clientAccount: Account = {
    id: 2,
    name: 'Cliente',
    abbreviation: '',
    account_type_id: clientAccountType.id,
};

export const supplierAccount: Account = {
    id: 3,
    name: 'Proveedor',
    abbreviation: '',
    account_type_id: supplierAccountType.id,
};

export const accounts: Account[] = [ownAccount, clientAccount, supplierAccount];
