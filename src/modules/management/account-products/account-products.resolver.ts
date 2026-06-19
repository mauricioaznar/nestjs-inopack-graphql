import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { AccountProductsService } from './account-products.service';
import {
    AccountProduct,
    AccountProductsUpsertInput,
    ActivityTypeName,
    Product,
    User,
} from '../../../common/dto/entities';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';

@Resolver(() => AccountProduct)
@UseGuards(GqlAuthGuard)
@Injectable()
export class AccountProductsResolver {
    constructor(
        private service: AccountProductsService,
        private pubSubService: PubSubService,
    ) {}

    @Query(() => [AccountProduct])
    async getAccountProducts(
        @Args('AccountId') accountId: number,
    ): Promise<AccountProduct[]> {
        return this.service.getAccountProducts({ account_id: accountId });
    }

    @Mutation(() => [AccountProduct])
    @RolesDecorator(RoleId.SALES)
    async upsertAccountProducts(
        @Args('AccountProductsUpsertInput') input: AccountProductsUpsertInput,
        @CurrentUser() currentUser: User,
    ): Promise<AccountProduct[]> {
        const accountProducts = await this.service.upsertAccountProducts({
            input,
        });
        const account = await this.service.getAccount({
            account_id: input.account_id,
        });
        if (account) {
            await this.pubSubService.accountProduct({
                account,
                type: ActivityTypeName.UPDATE,
                userId: currentUser.id,
            });
        }
        return accountProducts;
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
