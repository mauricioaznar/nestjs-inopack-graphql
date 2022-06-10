import { OrderSaleStatus } from '../../../dto/entities';

export const orderSaleCollectionStatus1: OrderSaleStatus = {
    id: 1,
    name: 'Pendiente',
};

export const orderSaleCollectionStatus2: OrderSaleStatus = {
    id: 2,
    name: 'Parcialmente cobrada',
};

export const orderSaleCollectionStatus3: OrderSaleStatus = {
    id: 3,
    name: 'Cobrada',
};

export const orderSaleCollectionStatus4: OrderSaleStatus = {
    id: 4,
    name: 'Reposicion',
};

export const orderSaleCollectionStatuses: OrderSaleStatus[] = [
    orderSaleCollectionStatus1,
    orderSaleCollectionStatus2,
    orderSaleCollectionStatus3,
    orderSaleCollectionStatus4,
];
