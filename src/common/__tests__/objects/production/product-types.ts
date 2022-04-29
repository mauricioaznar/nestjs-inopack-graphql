import { ProductType } from '../../../dto/entities/production/product-type.dto';
import {
    orderProductionType1,
    orderProductionType2,
    orderProductionType3,
    orderProductionType4,
} from './order-production-types';
import { productTypeCategory1 } from './product-type-categories';

export const productType1: ProductType = {
    id: 1,
    name: 'producto tipo 1',
    order_production_type_id: orderProductionType1.id,
    product_type_category_id: productTypeCategory1.id,
};

export const productType2: ProductType = {
    id: 2,
    name: 'producto tipo 2 ',
    order_production_type_id: orderProductionType2.id,
    product_type_category_id: productTypeCategory1.id,
};

export const productType3: ProductType = {
    id: 3,
    name: 'producto tipo 3',
    order_production_type_id: orderProductionType3.id,
    product_type_category_id: productTypeCategory1.id,
};

export const productType4: ProductType = {
    id: 4,
    name: 'producto tipo 4',
    order_production_type_id: orderProductionType4.id,
    product_type_category_id: productTypeCategory1.id,
};

export const productTypes: ProductType[] = [
    productType1,
    productType2,
    productType3,
    productType4,
];
