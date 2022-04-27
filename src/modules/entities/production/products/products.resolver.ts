import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from '../../../../common/dto/entities';
import { GqlAuthGuard } from '../../../auth/guards/gql-auth.guard';
import { Role } from '../../../auth/decorators/role.decorator';

@Resolver(() => Product)
@UseGuards(GqlAuthGuard)
@Injectable()
export class ProductsResolver {
    constructor(private partsService: ProductsService) {}

    @Query(() => [Product])
    @Role('super')
    async getProducts(): Promise<Product[]> {
        return this.partsService.getProducts();
    }

    @Query(() => Product)
    async getProduct(
        @Args('ProductId') productId: number,
    ): Promise<Product | null> {
        return this.partsService.getProduct({ product_id: productId });
    }
}
