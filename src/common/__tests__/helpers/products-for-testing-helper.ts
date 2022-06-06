import { orderProductionType1, packing1, productType1 } from '../objects';
import { ProductsService } from '../../../modules/entities/production/products/products.service';
import { Product } from '../../dto/entities';

export async function createProductForTesting({
    productsService,
    orderProductionTypeId = orderProductionType1.id,
    productTypeId = productType1.id,
}: {
    productsService: ProductsService;
    orderProductionTypeId?: number;
    productTypeId?: number;
}): Promise<Product | null | undefined> {
    try {
        return await productsService.upsertInput({
            order_production_type_id: orderProductionTypeId,
            product_type_id: productTypeId,
            width: 10,
            packing_id: packing1.id,
            calibre: 1,
            length: 1,
            current_group_weight: 10,
            code: 'codigo del producto 1',
            description: 'asdfasdfjwe description',
            current_kilo_price: 1,
        });
    } catch (e) {
        console.error(e);
    }
}
