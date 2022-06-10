import { OrderSaleStatus } from '../../../dto/entities';

export const orderSaleStatus1: OrderSaleStatus = {
    id: 1,
    name: 'Por entregar',
};

export const orderSaleStatus2: OrderSaleStatus = {
    id: 2,
    name: 'Entregado',
};

export const orderSaleStatuses: OrderSaleStatus[] = [
    orderSaleStatus1,
    orderSaleStatus2,
];
