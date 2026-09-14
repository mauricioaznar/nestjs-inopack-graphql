import { ReceiptType } from '../../../dto/entities';

export const receiptType1: ReceiptType = {
    id: 1,
    name: 'Nota',
    is_informal_receipt: true,
    tax_rate: 0,
};

export const receiptType2: ReceiptType = {
    id: 2,
    name: 'Factura',
    is_informal_receipt: false,
    tax_rate: 0.16,
};

export const receiptType3: ReceiptType = {
    id: 3,
    name: 'Reposicion',
    is_informal_receipt: false,
    tax_rate: 0,
};

export const receiptTypes: ReceiptType[] = [
    receiptType1,
    receiptType2,
    receiptType3,
];
