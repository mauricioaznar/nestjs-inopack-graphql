import { ReceiptType, OrderSaleStatus } from '../../../dto/entities';

export const receiptType1: ReceiptType = {
    id: 1,
    name: 'Nota',
    include_in_accountability_export: false,
};

export const receiptType2: ReceiptType = {
    id: 2,
    name: 'Factura',
    include_in_accountability_export: true,
};

export const receiptType3: ReceiptType = {
    id: 3,
    name: 'Reposicion',
    include_in_accountability_export: false,
};

export const receiptTypes: ReceiptType[] = [
    receiptType1,
    receiptType2,
    receiptType3,
];
