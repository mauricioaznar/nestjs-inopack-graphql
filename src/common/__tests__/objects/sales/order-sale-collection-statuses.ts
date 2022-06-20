import { OrderSaleCollectionStatus } from '../../../dto/entities';

export const orderSaleCollectionStatus1: OrderSaleCollectionStatus = {
    id: 1,
    name: 'Pendiente',
};

export const orderSaleCollectionStatus2: OrderSaleCollectionStatus = {
    id: 2,
    name: 'Parcialmente cobrada',
};

export const orderSaleCollectionStatus3: OrderSaleCollectionStatus = {
    id: 3,
    name: 'Cobrada',
};

export const orderSaleCollectionStatus4: OrderSaleCollectionStatus = {
    id: 4,
    name: 'Reposicion',
};

export const orderSaleCollectionStatuses: OrderSaleCollectionStatus[] = [
    orderSaleCollectionStatus1,
    orderSaleCollectionStatus2,
    orderSaleCollectionStatus3,
    orderSaleCollectionStatus4,
];
