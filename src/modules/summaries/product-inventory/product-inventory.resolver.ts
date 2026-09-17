import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ProductInventory } from '../../../common/dto/entities/production/product-inventory.dto';
import {
    InventoryMovement,
    ProductInventoryMovementsArgs,
} from '../../../common/dto/entities/production/inventory-movement.dto';
import { ProductInventoryService } from './product-inventory-service';
import { ProductInventoryMovementsService } from './product-inventory-movements.service';
import { Product } from '../../../common/dto/entities';

@Resolver(() => ProductInventory)
// @Role('super')
@Injectable()
export class ProductInventoryResolver {
    constructor(
        private service: ProductInventoryService,
        private movementsService: ProductInventoryMovementsService,
    ) {}

    @Query(() => [ProductInventory], { nullable: false })
    async getProductsInventory(): Promise<ProductInventory[]> {
        return this.service.getProductsInventory();
    }

    // Per-product drill-down: the individual sale / adjustment / production /
    // consumption rows behind a product's net balance, with a backward-
    // reconstructed stock level per row. Lazy — the client only calls this when
    // a product's collapsible row is opened.
    @Query(() => [InventoryMovement], { nullable: false })
    async getProductInventoryMovements(
        @Args() args: ProductInventoryMovementsArgs,
    ): Promise<InventoryMovement[]> {
        return this.movementsService.getProductInventoryMovements(args);
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
