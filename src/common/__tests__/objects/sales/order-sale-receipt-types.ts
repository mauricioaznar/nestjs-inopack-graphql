import { OrderSaleReceiptType, OrderSaleStatus } from '../../../dto/entities';

export const orderSaleReceiptType1: OrderSaleReceiptType = {
    id: 1,
    name: 'Nota',
};

export const orderSaleReceiptType2: OrderSaleReceiptType = {
    id: 2,
    name: 'Factura',
};

export const orderSaleReceiptType3: OrderSaleReceiptType = {
    id: 3,
    name: 'Reposicion',
};

export const orderSaleReceiptTypes: OrderSaleReceiptType[] = [
    orderSaleReceiptType1,
    orderSaleReceiptType2,
    orderSaleReceiptType3,
];
