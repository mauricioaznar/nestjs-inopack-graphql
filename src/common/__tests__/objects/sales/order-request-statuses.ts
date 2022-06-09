import { OrderRequestStatus } from '../../../dto/entities';

export const orderRequestStatus1: OrderRequestStatus = {
    id: 1,
    name: 'Pendiente',
};

export const orderRequestStatus2: OrderRequestStatus = {
    id: 2,
    name: 'En produccion',
};

export const orderRequestStatus3: OrderRequestStatus = {
    id: 3,
    name: 'Finalizado',
};

export const orderRequestStatus4: OrderRequestStatus = {
    id: 4,
    name: 'Cancelado',
};

export const orderRequestStatuses: OrderRequestStatus[] = [
    orderRequestStatus1,
    orderRequestStatus2,
    orderRequestStatus3,
    orderRequestStatus4,
];
