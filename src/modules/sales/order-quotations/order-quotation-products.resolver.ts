import { ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { OrderQuotationsService } from './order-quotations.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import {
    OrderQuotationProduct,
    Product,
} from '../../../common/dto/entities';

// Exposes the `product` relation on a quotation line, the same way
// OrderRequestProductsResolver does for pedido lines. Kept as its own resolver
// (rather than on OrderQuotationsResolver, which is @Resolver(() =>
// OrderQuotation)) because a ResolveField must live on a resolver for the type
// it decorates.
@Resolver(() => OrderQuotationProduct)
@UseGuards(GqlAuthGuard)
@Injectable()
export class OrderQuotationProductsResolver {
    constructor(private service: OrderQuotationsService) {}

    // NULLABLE — unlike the pedido side, a quotation line may be a free line
    // (product_id NULL), which has no product and renders its
    // proposed_description instead.
    @ResolveField(() => Product, { nullable: true })
    async product(
        orderQuotationProduct: OrderQuotationProduct,
    ): Promise<Product | null> {
        return this.service.getProduct({
            product_id: orderQuotationProduct.product_id,
        });
    }
}
