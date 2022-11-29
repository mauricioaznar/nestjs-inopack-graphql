import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { OrderProductionsService } from './order-productions.service';
import {
    OrderProduction,
    OrderProductionInput,
    OrderProductionQueryArgs,
    PaginatedOrderProductions,
} from '../../../common/dto/entities/production/order-production.dto';
import { OrderProductionProduct } from '../../../common/dto/entities/production/order-production-product.dto';
import { OrderProductionEmployee } from '../../../common/dto/entities/production/order-production-employee.dto';
import {
    ActivityTypeName,
    Branch,
    OrderProductionType,
    PaginatedOrderSales,
    User,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { OrderAdjustment } from '../../../common/dto/entities/production/order-adjustment.dto';

@Resolver(() => OrderProduction)
@UseGuards(GqlAuthGuard)
@Injectable()
export class OrderProductionsResolver {
    constructor(
        private service: OrderProductionsService,
        private pubSubService: PubSubService,
    ) {}

    @Query(() => OrderProduction)
    async getOrderProduction(
        @Args('OrderProductionId') orderProductionId: number,
    ): Promise<OrderProduction | null> {
        return this.service.getOrderProduction({
            order_production_id: orderProductionId,
        });
    }

    @Query(() => PaginatedOrderProductions)
    async paginatedOrderProductions(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
        @Args({ nullable: false })
        orderProductionQueryArgs: OrderProductionQueryArgs,
    ): Promise<PaginatedOrderSales> {
        return this.service.paginatedOrderProductions({
            offsetPaginatorArgs,
            datePaginator,
            orderProductionQueryArgs,
        });
    }

    @Mutation(() => OrderProduction)
    async upsertOrderProduction(
        @Args('OrderProductionInput') input: OrderProductionInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderProduction> {
        const orderProduction = await this.service.upsertOrderProduction(input);
        await this.pubSubService.orderProduction({
            orderProduction: orderProduction,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return orderProduction;
    }

    @Mutation(() => Boolean)
    async deleteOrderProduction(
        @Args('OrderProductionId') orderProductionId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const orderProduction = await this.service.getOrderProduction({
            order_production_id: orderProductionId,
        });
        if (!orderProduction) throw new NotFoundException();
        await this.service.deleteOrderProduction({
            order_production_id: orderProductionId,
        });
        await this.pubSubService.orderProduction({
            orderProduction,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
        });
        return true;
    }

    @ResolveField(() => [OrderProductionProduct])
    async order_production_products(
        orderProduction: OrderProduction,
    ): Promise<OrderProductionProduct[]> {
        return this.service.getOrderProductionProducts({
            order_production_id: orderProduction.id,
        });
    }

    @ResolveField(() => [OrderProductionEmployee])
    async order_production_employees(
        orderProduction: OrderProduction,
    ): Promise<OrderProductionEmployee[]> {
        return this.service.getOrderProductionEmployees({
            order_production_id: orderProduction.id,
        });
    }

    @ResolveField(() => Boolean)
    async is_deletable(
        @Parent() orderProduction: OrderProduction,
    ): Promise<boolean> {
        return true;
    }

    @ResolveField(() => OrderProductionType, { nullable: true })
    async order_production_type(
        @Parent() orderProduction: OrderProduction,
    ): Promise<OrderProductionType | null> {
        return this.service.getOrderProductionType({
            order_production_type_id: orderProduction.order_production_type_id,
        });
    }

    @ResolveField(() => Branch, { nullable: true })
    async branch(
        @Parent() orderProduction: OrderProduction,
    ): Promise<Branch | null> {
        return this.service.getBranch({
            branch_id: orderProduction.branch_id,
        });
    }

    @Subscription(() => OrderProduction)
    async order_production() {
        return this.pubSubService.listenForOrderProduction();
    }
}
