import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ProductInventory } from '../../../common/dto/entities/production/product-inventory.dto';
import { ProductionSummaryService } from './production-summary.service';
import { Product } from '../../../common/dto/entities';

@Resolver(() => ProductInventory)
// @Role('super')
@Injectable()
export class ProductionSummaryResolver {
    constructor(private service: ProductionSummaryService) {}

    @Query(() => [ProductInventory], { nullable: false })
    async getProductsInventory(): Promise<ProductInventory[]> {
        return this.service.getProductsInventory();
    }

    @ResolveField(() => Product, { nullable: true })
    async product(
        @Parent() productInventory: ProductInventory,
    ): Promise<Product | null> {
        return this.service.getProduct({
            product_id: productInventory.product_id,
        });
    }
}
