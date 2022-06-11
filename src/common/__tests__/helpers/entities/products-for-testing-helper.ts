import { orderProductionType1, packing1, productType1 } from '../../objects';
import { ProductsService } from '../../../../modules/entities/production/products/products.service';
import { Product } from '../../../dto/entities';
import { INestApplication } from '@nestjs/common';

export async function createProductForTesting({
    app,
    order_production_type_id = orderProductionType1.id,
    product_type_id = productType1.id,
    current_group_weight = 10,
}: {
    app: INestApplication;
    order_production_type_id?: number;
    product_type_id?: number;
    current_group_weight?: number;
}): Promise<Product> {
    const productsService = app.get(ProductsService);

    try {
        return await productsService.upsertInput({
            order_production_type_id: order_production_type_id,
            product_type_id: product_type_id,
            width: 10,
            packing_id: packing1.id,
            calibre: 1,
            length: 1,
            current_group_weight: current_group_weight,
            code: 'codigo del producto 1',
            description: 'asdfasdfjwe description',
            current_kilo_price: 1,
        });
    } catch (e) {
        console.error(e);
    }

    throw new Error('createProductForTesting failed');
}
