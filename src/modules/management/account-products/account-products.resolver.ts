import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { AccountProductsService } from './account-products.service';
import { AccountProduct, Product } from '../../../common/dto/entities';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';

@Resolver(() => AccountProduct)
@UseGuards(GqlAuthGuard)
@Injectable()
export class AccountProductsResolver {
    constructor(private service: AccountProductsService) {}

    @Query(() => [AccountProduct])
    async getAccountProducts(
        @Args('AccountId') accountId: number,
    ): Promise<AccountProduct[]> {
        return this.service.getAccountProducts({ account_id: accountId });
    }

    @ResolveField(() => Product, { nullable: true })
    async product(
        @Parent() accountProduct: AccountProduct,
    ): Promise<Product | null> {
        return this.service.getProduct({
            product_id: accountProduct.product_id,
        });
    }
}
