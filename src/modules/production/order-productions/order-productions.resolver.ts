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
    ActivityEntityName,
    ActivityTypeName,
    Branch,
    OrderProductionProductConsumed,
    OrderProductionType,
    User,
} from '../../../common/dto/entities';
import {
    OffsetPaginatorArgs,
    DatePaginator,
} from '../../../common/dto/pagination';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import {
    captureSnapshotSafely,
    INTENTIONALLY_ABSENT,
} from '../../../common/modules/pub-sub/activity-audit';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Resolver(() => OrderProduction)
@UseGuards(GqlAuthGuard)
@Injectable()
export class OrderProductionsResolver {
    constructor(
        private service: OrderProductionsService,
        private pubSubService: PubSubService,
        private auditUsersService: AuditUsersService,
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
        @Args({ nullable: false }) datePaginator: DatePaginator,
        @Args({ nullable: false })
        orderProductionQueryArgs: OrderProductionQueryArgs,
    ): Promise<PaginatedOrderProductions> {
        return this.service.paginatedOrderProductions({
            offsetPaginatorArgs,
            datePaginator,
            orderProductionQueryArgs,
        });
    }

    @Mutation(() => OrderProduction)
    @RolesDecorator(RoleId.PRODUCTION)
    async upsertOrderProduction(
        @Args('OrderProductionInput') input: OrderProductionInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderProduction> {
        const type = !input.id
            ? ActivityTypeName.CREATE
            : ActivityTypeName.UPDATE;
        const auditContext = {
            entityName: ActivityEntityName.ORDER_PRODUCTION,
            entityId: input.id ?? null,
            activityType: type,
            userId: currentUser.id,
        };
        // Audit: capture the row BEFORE the write. On a create there is nothing
        // to capture, so the old side is intentionally absent and the pair reads
        // as "nothing -> something". Guarded: a snapshot read that throws must
        // not stop the save from happening.
        const oldCapture = input.id
            ? await captureSnapshotSafely(auditContext, 'old_snapshot', () =>
                  this.service.getOrderProductionSnapshot({
                      order_production_id: input.id!,
                  }),
              )
            : INTENTIONALLY_ABSENT;
        // OUTSIDE every audit guard — a real save failure still fails.
        const orderProduction = await this.service.upsertOrderProduction(
            input,
            { current_user_id: currentUser.id },
        );
        const newCapture = await captureSnapshotSafely(
            { ...auditContext, entityId: orderProduction.id },
            'new_snapshot',
            () =>
                this.service.getOrderProductionSnapshot({
                    order_production_id: orderProduction.id,
                }),
        );
        await this.pubSubService.orderProduction({
            orderProduction: orderProduction,
            type,
            userId: currentUser.id,
            oldCapture,
            newCapture,
        });
        return orderProduction;
    }

    @Mutation(() => Boolean)
    @RolesDecorator(RoleId.PRODUCTION)
    async deleteOrderProduction(
        @Args('OrderProductionId') orderProductionId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const orderProduction = await this.service.getOrderProduction({
            order_production_id: orderProductionId,
        });
        if (!orderProduction) throw new NotFoundException();
        // Must be captured before the write: the delete is soft, so afterwards
        // the production and all three child collections carry active = -1 and
        // the snapshot would come back with no children. The new side is
        // intentionally absent — "deleted" is what the dialog should show, not
        // "active went 1 -> -1".
        const oldCapture = await captureSnapshotSafely(
            {
                entityName: ActivityEntityName.ORDER_PRODUCTION,
                entityId: orderProductionId,
                activityType: ActivityTypeName.DELETE,
                userId: currentUser.id,
            },
            'old_snapshot',
            () =>
                this.service.getOrderProductionSnapshot({
                    order_production_id: orderProductionId,
                }),
        );
        await this.service.deleteOrderProduction({
            order_production_id: orderProductionId,
            current_user_id: currentUser.id,
        });
        await this.pubSubService.orderProduction({
            orderProduction,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
            oldCapture,
            newCapture: INTENTIONALLY_ABSENT,
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

    @ResolveField(() => [OrderProductionProductConsumed])
    async order_production_products_consumed(
        orderProduction: OrderProduction,
    ): Promise<OrderProductionProductConsumed[]> {
        return this.service.getOrderProductionProductsConsumed({
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

    @ResolveField(() => User, { nullable: true })
    async created_by(
        @Parent() orderProduction: OrderProduction,
    ): Promise<User | null> {
        return this.auditUsersService.getCreatedBy({
            created_by_id: orderProduction.created_by_id,
        });
    }

    @ResolveField(() => User, { nullable: true })
    async updated_by(
        @Parent() orderProduction: OrderProduction,
    ): Promise<User | null> {
        return this.auditUsersService.getUpdatedBy({
            updated_by_id: orderProduction.updated_by_id,
        });
    }

    @Subscription(() => OrderProduction)
    async order_production() {
        return this.pubSubService.listenForOrderProduction();
    }
}
