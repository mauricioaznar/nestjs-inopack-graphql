import { orderProductionType1 } from '../../objects';
import { ProductsService } from '../../../../modules/production/products/products.service';
import { Product } from '../../../dto/entities';
import { INestApplication } from '@nestjs/common';

export async function createProductForTesting({
    app,
    order_production_type_id = orderProductionType1.id,
    current_group_weight = 10,
}: {
    app: INestApplication;
    order_production_type_id?: number;
    current_group_weight?: number;
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
            product_category_id: null,
            product_material_id: null,
            discontinued: false,
            internal_description: '',
            external_description: '',
        });
    } catch (e) {
        console.error(e);
    }

    throw new Error('createProductForTesting failed');
}
