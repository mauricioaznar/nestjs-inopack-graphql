import { ReceiptType } from '../../../dto/entities';

export const receiptType1: ReceiptType = {
    id: 1,
    name: 'Nota',
    include_in_accountability_export: false,
    tax_rate: 0,
};

export const receiptType2: ReceiptType = {
    id: 2,
    name: 'Factura',
    include_in_accountability_export: true,
    tax_rate: 0.16,
};

export const receiptType3: ReceiptType = {
    id: 3,
    name: 'Reposicion',
    include_in_accountability_export: false,
    tax_rate: 0,
};

export const receiptTypes: ReceiptType[] = [
    receiptType1,
    receiptType2,
    receiptType3,
];
