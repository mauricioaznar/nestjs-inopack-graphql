import { ProductCategory } from '../../../dto/entities/production/product-category.dto';
import {
    orderProductionType1,
    orderProductionType2,
    orderProductionType3,
    orderProductionType4,
} from './order-production-types';

export const productCategory1: ProductCategory = {
    id: 1,
    name: 'categoria del producto 1',
    order_production_type_id: orderProductionType1.id,
};

export const productCategory2: ProductCategory = {
    id: 2,
    name: 'categoria del producto 2',
    order_production_type_id: orderProductionType2.id,
};

export const productCategory3: ProductCategory = {
    id: 3,
    name: 'categoria del producto 3',
    order_production_type_id: orderProductionType3.id,
};

export const productCategory4: ProductCategory = {
    id: 4,
    name: 'categoria del producto 4',
    order_production_type_id: orderProductionType4.id,
};

export const productCategories: ProductCategory[] = [
    productCategory1,
    productCategory2,
    productCategory3,
    productCategory4,
];
