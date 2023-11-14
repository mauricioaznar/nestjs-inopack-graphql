import {
    Args,
    Float,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { RawMaterialAdditionsService } from './raw-material-additions.service';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
    Account,
    ActivityTypeName,
    Branch,
    Expense,
    GetRawMaterialAdditionsQueryArgs,
    PaginatedRawMaterialAdditions,
    PaginatedRawMaterialAdditionsQueryArgs,
    PaginatedRawMaterialAdditionsSortArgs,
    RawMaterialAddition,
    RawMaterialAdditionItem,
    RawMaterialAdditionUpsertInput,
    User,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';
import { OrderProductionProduct } from '../../../common/dto/entities/production/order-production-product.dto';
import {
    OrderProduction,
    OrderProductionQueryArgs,
} from '../../../common/dto/entities/production/order-production.dto';

@Resolver(() => RawMaterialAddition)
@UseGuards(GqlAuthGuard)
@Injectable()
export class RawMaterialAdditionsResolver {
    constructor(
        private service: RawMaterialAdditionsService,
        private pubSubService: PubSubService,
    ) {}

    @Query(() => [RawMaterialAddition])
    async getRawMaterialAdditions(
        @Args({ nullable: false })
        getRawMaterialAdditionsQueryArgs: GetRawMaterialAdditionsQueryArgs,
    ): Promise<RawMaterialAddition[]> {
        return this.service.getRawMaterialAdditions({
            getRawMaterialAdditionsQueryArgs,
        });
    }

    @Query(() => [RawMaterialAddition])
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
    async getRawMaterialAdditionsWithDisparities(): Promise<
        RawMaterialAddition[]
    > {
        return this.service.getRawMaterialAdditionsWithDisparities();
    }

    @Query(() => PaginatedRawMaterialAdditions)
    async paginatedRawMaterialAdditions(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false })
        paginatedRawMaterialAdditionsQueryArgs: PaginatedRawMaterialAdditionsQueryArgs,
        @Args({ nullable: false })
        paginatedRawMaterialAdditionsSortArgs: PaginatedRawMaterialAdditionsSortArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
    ): Promise<PaginatedRawMaterialAdditions> {
        return this.service.paginatedRawMaterialAdditions({
            datePaginator,
            offsetPaginatorArgs,
            paginatedRawMaterialAdditionsSortArgs,
            paginatedRawMaterialAdditionsQueryArgs,
        });
    }

    @Query(() => RawMaterialAddition, { nullable: true })
    async getRawMaterialAddition(
        @Args('RawMaterialAdditionId') rawMaterialAdditionId: number,
    ): Promise<RawMaterialAddition | null> {
        return this.service.getRawMaterialAddition({
            rawMaterialAdditionId: rawMaterialAdditionId,
        });
    }

    @Mutation(() => RawMaterialAddition)
    @RolesDecorator(RoleId.PRODUCTION)
    async upsertRawMaterialAddition(
        @Args('RawMaterialAdditionUpsertInput')
        input: RawMaterialAdditionUpsertInput,
        @CurrentUser() currentUser: User,
    ): Promise<RawMaterialAddition> {
        const rawMaterialAddition =
            await this.service.upsertRawMaterialAddition(input);
        await this.pubSubService.rawMaterialAddition({
            rawMaterialAddition,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return rawMaterialAddition;
    }

    @Mutation(() => Boolean)
    @RolesDecorator(RoleId.PRODUCTION)
    async deleteRawMaterialAddition(
        @Args('RawMaterialAdditionId') rawMaterialAdditionId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const rawMaterialAddition = await this.service.getRawMaterialAddition({
            rawMaterialAdditionId,
        });
        if (!rawMaterialAddition) throw new NotFoundException();

        await this.service.deletesRawMaterialAddition({
            rawMaterialAddition_id: rawMaterialAdditionId,
        });
        await this.pubSubService.rawMaterialAddition({
            rawMaterialAddition,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
        });
        return true;
    }

    @ResolveField(() => [RawMaterialAdditionItem])
    async raw_material_addition_items(
        rawMaterialAddition: RawMaterialAddition,
    ): Promise<RawMaterialAdditionItem[]> {
        return this.service.getRawMaterialAdditionItems({
            raw_material_addition_id: rawMaterialAddition.id,
        });
    }

    @ResolveField(() => Boolean)
    async is_deletable(
        @Parent() rawMaterialAddition: RawMaterialAddition,
    ): Promise<boolean> {
        return this.service.isDeletable({
            rawMaterialAddition_id: rawMaterialAddition.id,
        });
    }

    @Subscription(() => RawMaterialAddition)
    async raw_material_addition() {
        return this.pubSubService.listenForRawMaterialAddition();
    }

    @ResolveField(() => Account, { nullable: true })
    async account(
        @Parent() rawMaterialAddition: RawMaterialAddition,
    ): Promise<Account | null> {
        return this.service.getAccount({
            account_id: rawMaterialAddition.account_id,
        });
    }

    @ResolveField(() => String, { nullable: true })
    async compound_name(
        @Parent() rawMaterialAddition: RawMaterialAddition,
    ): Promise<string> {
        return this.service.getCompoundName({
            raw_material_addition_id: rawMaterialAddition.id,
        });
    }

    @ResolveField(() => Float, { nullable: false })
    async total(
        @Parent() rawMaterialAddition: RawMaterialAddition,
    ): Promise<number> {
        return this.service.getTotal({
            raw_material_addition_id: rawMaterialAddition.id,
        });
    }
}
