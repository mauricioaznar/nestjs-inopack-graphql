import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import {
    ActivityTypeName,
    PaginatedPurchases,
    Purchase,
    PurchasesQueryArgs,
    PurchasesSortArgs,
    PurchaseUpsertInput,
    User,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';

@Resolver(() => Purchase)
@Injectable()
export class PurchasesResolver {
    constructor(
        private service: PurchasesService,
        private pubSubService: PubSubService,
    ) {}

    @Mutation(() => Purchase)
    async upsertPurchase(
        @Args('PurchaseUpsertInput') input: PurchaseUpsertInput,
        @CurrentUser() currentUser: User,
    ) {
        const purchase = await this.service.upsertPurchase(input);
        await this.pubSubService.purchase({
            purchase,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });

        return purchase;
    }

    @Mutation(() => Boolean)
    async deletePurchase(
        @Args('PurchaseId') purchaseId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const purchase = await this.getPurchase(purchaseId);
        if (!purchase) throw new NotFoundException();
        await this.service.deletePurchase({
            purchase_id: purchase.id,
        });
        await this.pubSubService.purchase({
            purchase,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
        });
        return true;
    }

    @Query(() => Purchase, {
        nullable: true,
    })
    async getPurchase(
        @Args('PurchaseId') id: number,
    ): Promise<Purchase | null> {
        return this.service.getPurchase({ purchase_id: id });
    }

    @Query(() => [Purchase])
    async getPurchases(): Promise<Purchase[]> {
        return this.service.getPurchases();
    }

    @Query(() => PaginatedPurchases)
    async paginatedPurchases(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
        @Args({ nullable: false })
        purchasesQueryArgs: PurchasesQueryArgs,
        @Args({ nullable: false })
        purchasesSortArgs: PurchasesSortArgs,
    ): Promise<PaginatedPurchases> {
        return this.service.paginatedPurchases({
            offsetPaginatorArgs,
            datePaginator,
            purchasesQueryArgs,
            purchasesSortArgs,
        });
    }

    @ResolveField(() => Boolean)
    async is_deletable(
        @Parent() purchase: Purchase,
        @CurrentUser() user: User,
    ): Promise<boolean> {
        return this.service.isDeletable({
            purchase_id: purchase.id,
        });
    }

    @ResolveField(() => Boolean)
    async is_editable(
        @Parent() purchase: Purchase,
        @CurrentUser() user: User,
    ): Promise<boolean> {
        return this.service.isEditable({
            purchase_id: purchase.id,
        });
    }

    @Subscription(() => Purchase)
    async purchase() {
        return this.pubSubService.listenForPurchase();
    }
}
