import { OrderProductionType } from '../../../dto/entities';

export const orderProductionType1: OrderProductionType = {
    id: 1,
    name: 'corte y bolseo',
};

export const orderProductionType2: OrderProductionType = {
    id: 2,
    name: 'extrusion',
};

export const orderProductionType3: OrderProductionType = {
    id: 3,
    name: 'pellet',
};

export const orderProductionType4: OrderProductionType = {
    id: 4,
    name: 'lavado',
};

export const orderProductionTypes: OrderProductionType[] = [
    orderProductionType1,
    orderProductionType2,
    orderProductionType3,
    orderProductionType4,
];
