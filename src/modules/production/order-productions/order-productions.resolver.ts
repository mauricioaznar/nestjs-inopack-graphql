import {
    Args,
    Mutation,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { OrderProductionsService } from './order-productions.service';
import {
    OrderProduction,
    OrderProductionInput,
    OrderProductionQueryArgs,
    PaginatedOrderProductions,
} from '../../../common/dto/entities/production/order-production.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { OrderProductionProduct } from '../../../common/dto/entities/production/order-production-product.dto';
import { OrderProductionEmployee } from '../../../common/dto/entities/production/order-production-employee.dto';
import { PaginatedOrderSales, User } from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

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
        await this.pubSubService.publishOrderProduction({
            orderProduction: orderProduction,
            create: !input.id,
            userId: currentUser.id,
        });
        return orderProduction;
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

    @Subscription(() => OrderProduction)
    async order_production() {
        return this.pubSubService.listenForOrderProduction();
    }
}
