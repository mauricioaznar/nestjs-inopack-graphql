import { orderProductionType1, packing1, productType1 } from '../objects';
import { ProductsService } from '../../../modules/entities/production/products/products.service';
import { Product } from '../../dto/entities';

export async function createProductForTesting({
    productsService,
}: {
    productsService: ProductsService;
}): Promise<Product> {
    expect.hasAssertions();

    try {
        const product = await productsService.upsertInput({
            order_production_type_id: orderProductionType1.id,
            product_type_id: productType1.id,
            width: 10,
            packing_id: packing1.id,
            calibre: 1,
            length: 1,
            current_group_weight: 10,
            code: 'codigo del producto 1',
            description: 'asdfasdfjwe description',
            current_kilo_price: 1,
        });

        expect(product.id).toBeDefined();

        return product;
    } catch (e) {
        console.error(e);
    }
}
