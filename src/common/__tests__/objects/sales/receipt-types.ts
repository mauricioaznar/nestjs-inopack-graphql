import { ReceiptType, OrderSaleStatus } from '../../../dto/entities';

export const receiptType1: ReceiptType = {
    id: 1,
    name: 'Nota',
};

export const receiptType2: ReceiptType = {
    id: 2,
    name: 'Factura',
};

export const receiptType3: ReceiptType = {
    id: 3,
    name: 'Reposicion',
};

export const receiptTypes: ReceiptType[] = [
    receiptType1,
    receiptType2,
    receiptType3,
];
