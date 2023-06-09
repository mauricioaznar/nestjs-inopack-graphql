import { orderProductionType1 } from '../../objects';
import { ProductsService } from '../../../../modules/production/products/products.service';
import { Product } from '../../../dto/entities';
import { INestApplication } from '@nestjs/common';
import { productCategory1 } from '../../objects/production/product-categories';

export async function createProductForTesting({
    app,
    order_production_type_id = orderProductionType1.id,
    current_group_weight = 10,
    product_category_id = productCategory1.id,
}: {
    app: INestApplication;
    order_production_type_id?: number;
    current_group_weight?: number;
    product_category_id?: number;
}): Promise<Product> {
    const productsService = app.get(ProductsService);

    try {
        return await productsService.upsertInput({
            order_production_type_id: order_production_type_id,
            width: 10,
            calibre: 1,
            length: 1,
            current_group_weight: current_group_weight,
            code: 'codigo del producto 1',
            current_kilo_price: 1,
            product_category_id: product_category_id,
            product_material_id: null,
            discontinued: false,
            internal_description: '',
            external_description: '',
            current_group_price: 0,
        });
    } catch (e) {
        console.error(e);
    }

    throw new Error('createProductForTesting failed');
}
