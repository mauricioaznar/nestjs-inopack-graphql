import {
    Args,
    Float,
    Int,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { OrderQuotationsService } from './order-quotations.service';
import {
    ActivityEntityName,
    ActivityTypeName,
    Account,
    GetOrderQuotationsArgs,
    OrderQuotation,
    OrderQuotationCatalogPreview,
    OrderQuotationDetailsInput,
    OrderQuotationInput,
    OrderQuotationPedidoStepState,
    OrderQuotationProduct,
    OrderQuotationsSortArgs,
    OrderQuotationStatus,
    OrderRequest,
    PaginatedOrderQuotations,
    PaginatedOrderQuotationsQueryArgs,
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

@Resolver(() => OrderQuotation)
@UseGuards(GqlAuthGuard)
@Injectable()
export class OrderQuotationsResolver {
    constructor(
        private service: OrderQuotationsService,
        private pubSubService: PubSubService,
        private auditUsersService: AuditUsersService,
    ) {}

    @Query(() => OrderQuotation, { nullable: true })
    async getOrderQuotation(
        @Args('OrderQuotationId') orderQuotationId: number,
    ): Promise<OrderQuotation | null> {
        return this.service.getOrderQuotation({
            orderQuotationId: orderQuotationId,
        });
    }

    @Query(() => [OrderQuotation])
    async getOrderQuotations(
        @Args() getOrderQuotationsArgs: GetOrderQuotationsArgs,
    ): Promise<OrderQuotation[]> {
        return this.service.getOrderQuotations(getOrderQuotationsArgs);
    }

    @Query(() => Float)
    async getOrderQuotationMaxOrderCode(): Promise<number> {
        return this.service.getOrderQuotationMaxOrderCode();
    }

    @Query(() => PaginatedOrderQuotations)
    async paginatedOrderQuotations(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: DatePaginator,
        @Args({ nullable: false })
        paginatedOrderQuotationsQueryArgs: PaginatedOrderQuotationsQueryArgs,
        @Args({ nullable: false })
        orderQuotationsSortArgs: OrderQuotationsSortArgs,
    ): Promise<PaginatedOrderQuotations> {
        return this.service.paginatedOrderQuotations({
            offsetPaginatorArgs,
            datePaginator,
            paginatedOrderQuotationsQueryArgs,
            orderQuotationsSortArgs,
        });
    }

    @Query(() => Boolean)
    async isOrderQuotationCodeOccupied(
        @Args('OrderCode') orderCode: number,
        @Args('OrderQuotationId', { nullable: true, type: () => Int })
        orderQuotationId: number | null,
    ): Promise<boolean> {
        return await this.service.isOrderQuotationCodeOccupied({
            order_quotation_id: orderQuotationId,
            order_code: orderCode,
        });
    }

    // Read-only preview behind the acceptance screen: what accepting will do to
    // the client's catalog, plus the blocking reasons behind a disabled button.
    // Writes nothing.
    @Query(() => OrderQuotationCatalogPreview)
    async getOrderQuotationCatalogChanges(
        @Args('OrderQuotationId', { type: () => Int }) orderQuotationId: number,
    ): Promise<OrderQuotationCatalogPreview> {
        return this.service.getOrderQuotationCatalogChanges({
            order_quotation_id: orderQuotationId,
        });
    }

    // insert + update === upsert
    @Mutation(() => OrderQuotation)
    @RolesDecorator(RoleId.SALES)
    async upsertOrderQuotation(
        @Args('OrderQuotationInput') input: OrderQuotationInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderQuotation> {
        const type = !input.id
            ? ActivityTypeName.CREATE
            : ActivityTypeName.UPDATE;
        const auditContext = {
            entityName: ActivityEntityName.ORDER_QUOTATION,
            entityId: input.id ?? null,
            activityType: type,
            userId: currentUser.id,
        };
        // Audit: capture the row BEFORE the write. On a create there is nothing
        // to capture, so the old side is intentionally absent. Guarded: a
        // snapshot read that throws must not stop the save from happening.
        const oldCapture = input.id
            ? await captureSnapshotSafely(auditContext, 'old_snapshot', () =>
                  this.service.getOrderQuotationSnapshot({
                      order_quotation_id: input.id!,
                  }),
              )
            : INTENTIONALLY_ABSENT;
        // OUTSIDE every audit guard — a real save failure still fails.
        const orderQuotation = await this.service.upsertOrderQuotation({
            input,
            current_user_id: currentUser.id,
        });
        const newCapture = await captureSnapshotSafely(
            { ...auditContext, entityId: orderQuotation.id },
            'new_snapshot',
            () =>
                this.service.getOrderQuotationSnapshot({
                    order_quotation_id: orderQuotation.id,
                }),
        );
        await this.pubSubService.orderQuotation({
            orderQuotation,
            type,
            userId: currentUser.id,
            oldCapture,
            newCapture,
        });
        return orderQuotation;
    }

    // Admin-only status change. Status is not accepted on upsertOrderQuotation,
    // so this is the only way to move a quotation between statuses.
    @Mutation(() => OrderQuotation)
    @RolesDecorator(RoleId.ADMIN)
    async updateOrderQuotationStatus(
        @Args('OrderQuotationId', { type: () => Int }) orderQuotationId: number,
        @Args('OrderQuotationStatusId', { type: () => Int })
        orderQuotationStatusId: number,
        @CurrentUser() currentUser: User,
    ): Promise<OrderQuotation> {
        const auditContext = {
            entityName: ActivityEntityName.ORDER_QUOTATION,
            entityId: orderQuotationId,
            activityType: ActivityTypeName.UPDATE,
            userId: currentUser.id,
        };
        const oldCapture = await captureSnapshotSafely(
            auditContext,
            'old_snapshot',
            () =>
                this.service.getOrderQuotationSnapshot({
                    order_quotation_id: orderQuotationId,
                }),
        );
        const orderQuotation = await this.service.updateOrderQuotationStatus({
            order_quotation_id: orderQuotationId,
            order_quotation_status_id: orderQuotationStatusId,
        });
        const newCapture = await captureSnapshotSafely(
            auditContext,
            'new_snapshot',
            () =>
                this.service.getOrderQuotationSnapshot({
                    order_quotation_id: orderQuotation.id,
                }),
        );
        await this.pubSubService.orderQuotation({
            orderQuotation,
            type: ActivityTypeName.UPDATE,
            userId: currentUser.id,
            oldCapture,
            newCapture,
        });
        return orderQuotation;
    }

    // Edit the optional operational fields (notes, estimated delivery date,
    // condiciones de pago) of a quotation. Deliberately NOT status-locked
    // (unlike upsert): operational metadata must stay editable after the
    // status-1 lock, mirroring updateOrderRequestDetails.
    @Mutation(() => OrderQuotation)
    @RolesDecorator(RoleId.SALES)
    async updateOrderQuotationDetails(
        @Args('OrderQuotationDetailsInput') input: OrderQuotationDetailsInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderQuotation> {
        const auditContext = {
            entityName: ActivityEntityName.ORDER_QUOTATION,
            entityId: input.order_quotation_id,
            activityType: ActivityTypeName.UPDATE,
            userId: currentUser.id,
        };
        const oldCapture = await captureSnapshotSafely(
            auditContext,
            'old_snapshot',
            () =>
                this.service.getOrderQuotationSnapshot({
                    order_quotation_id: input.order_quotation_id,
                }),
        );
        const orderQuotation = await this.service.updateOrderQuotationDetails({
            input,
        });
        const newCapture = await captureSnapshotSafely(
            auditContext,
            'new_snapshot',
            () =>
                this.service.getOrderQuotationSnapshot({
                    order_quotation_id: orderQuotation.id,
                }),
        );
        await this.pubSubService.orderQuotation({
            orderQuotation,
            type: ActivityTypeName.UPDATE,
            userId: currentUser.id,
            oldCapture,
            newCapture,
        });
        return orderQuotation;
    }

    // Acceptance — ADMIN only, exactly like pedido/venta status changes, because
    // accepting writes the client's price catalog (upsertAccount is already
    // ADMIN). The service runs the three steps (catálogo → pedido → estado),
    // skips any already done (resumable), refuses when terminal or blocked, and
    // publishes all three audit envelopes itself — see the comment on
    // acceptOrderQuotation for why that publishing is in the service here.
    @Mutation(() => OrderQuotation)
    @RolesDecorator(RoleId.ADMIN)
    async acceptOrderQuotation(
        @Args('OrderQuotationId', { type: () => Int }) orderQuotationId: number,
        @CurrentUser() currentUser: User,
    ): Promise<OrderQuotation> {
        return this.service.acceptOrderQuotation({
            order_quotation_id: orderQuotationId,
            current_user_id: currentUser.id,
        });
    }

    // Point a persisted FREE line at a real product without a full upsert — the
    // "Ventas apunta la línea libre al producto ya creado" step. SALES-gated,
    // allowed only while Borrador/Enviada and before acceptance starts, refuses a
    // relink or an incompatible group weight. The service validates, writes only
    // product_id, and publishes the quotation subscription + audit itself. See
    // the plan, "Allow linking a persisted free line to a product".
    @Mutation(() => OrderQuotation)
    @RolesDecorator(RoleId.SALES)
    async linkOrderQuotationProduct(
        @Args('OrderQuotationProductId', { type: () => Int })
        orderQuotationProductId: number,
        @Args('ProductId', { type: () => Int }) productId: number,
        @CurrentUser() currentUser: User,
    ): Promise<OrderQuotation> {
        return this.service.linkOrderQuotationProduct({
            order_quotation_product_id: orderQuotationProductId,
            product_id: productId,
            current_user_id: currentUser.id,
        });
    }

    @Mutation(() => Boolean)
    @RolesDecorator(RoleId.SALES)
    async deleteOrderQuotation(
        @Args('OrderQuotationId') orderQuotationId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const orderQuotation = await this.service.getOrderQuotation({
            orderQuotationId: orderQuotationId,
        });
        if (!orderQuotation) {
            throw new NotFoundException();
        }
        // Must be captured before the write: the delete is soft, so afterwards
        // the quotation and its lines all carry active = -1 and the snapshot
        // would come back with no children. The new side is intentionally
        // absent — "deleted" is what the dialog should show.
        const oldCapture = await captureSnapshotSafely(
            {
                entityName: ActivityEntityName.ORDER_QUOTATION,
                entityId: orderQuotationId,
                activityType: ActivityTypeName.DELETE,
                userId: currentUser.id,
            },
            'old_snapshot',
            () =>
                this.service.getOrderQuotationSnapshot({
                    order_quotation_id: orderQuotationId,
                }),
        );
        await this.service.deleteOrderQuotation({
            order_quotation_id: orderQuotationId,
            current_user_id: currentUser.id,
        });
        await this.pubSubService.orderQuotation({
            orderQuotation,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
            oldCapture,
            newCapture: INTENTIONALLY_ABSENT,
        });
        return true;
    }

    @ResolveField(() => [OrderQuotationProduct])
    async order_quotation_products(
        orderQuotation: OrderQuotation,
    ): Promise<OrderQuotationProduct[]> {
        return this.service.getOrderQuotationProducts({
            order_quotation_id: orderQuotation.id,
        });
    }

    @ResolveField(() => Float)
    async products_total(
        @Parent() orderQuotation: OrderQuotation,
    ): Promise<number> {
        return this.service.getOrderQuotationProductsTotal({
            order_quotation_id: orderQuotation.id,
        });
    }

    @ResolveField(() => Float)
    async subtotal(@Parent() orderQuotation: OrderQuotation): Promise<number> {
        return this.service.getOrderQuotationProductsTotal({
            order_quotation_id: orderQuotation.id,
        });
    }

    @ResolveField(() => Float)
    async tax(@Parent() orderQuotation: OrderQuotation): Promise<number> {
        return this.service.getOrderQuotationTax({
            order_quotation_id: orderQuotation.id,
            require_tax: orderQuotation.require_tax,
        });
    }

    @ResolveField(() => Float)
    async total(@Parent() orderQuotation: OrderQuotation): Promise<number> {
        return this.service.getOrderQuotationTotal({
            order_quotation_id: orderQuotation.id,
            require_tax: orderQuotation.require_tax,
        });
    }

    @ResolveField(() => Boolean)
    is_expired(@Parent() orderQuotation: OrderQuotation): boolean {
        return this.service.isExpired({
            expiration_date: orderQuotation.expiration_date,
        });
    }

    @ResolveField(() => Boolean)
    async is_acceptable(
        @Parent() orderQuotation: OrderQuotation,
    ): Promise<boolean> {
        return this.service.isAcceptable({
            order_quotation_id: orderQuotation.id,
        });
    }

    // The three acceptance step-states + the roll-up, for the acceptance panel.
    // catalog_step_done reads the STORED account_products_updated_at;
    // order_request_step_done derives from a linked pedido (ignoring active);
    // status_step_done reads the status. See the plan, "One stored column".
    @ResolveField(() => Boolean)
    async catalog_step_done(
        @Parent() orderQuotation: OrderQuotation,
    ): Promise<boolean> {
        return (await this.service.getAcceptanceSteps(orderQuotation))
            .catalog_step_done;
    }

    @ResolveField(() => Boolean)
    async order_request_step_done(
        @Parent() orderQuotation: OrderQuotation,
    ): Promise<boolean> {
        return (await this.service.getAcceptanceSteps(orderQuotation))
            .order_request_step_done;
    }

    @ResolveField(() => Boolean)
    async status_step_done(
        @Parent() orderQuotation: OrderQuotation,
    ): Promise<boolean> {
        return (await this.service.getAcceptanceSteps(orderQuotation))
            .status_step_done;
    }

    @ResolveField(() => Boolean)
    async acceptance_complete(
        @Parent() orderQuotation: OrderQuotation,
    ): Promise<boolean> {
        return (await this.service.getAcceptanceSteps(orderQuotation))
            .acceptance_complete;
    }

    // The Pedido step as a diagnostic tri-state for the diagnostics tab:
    // NOT_CREATED / CREATED_INCOMPLETE / COMPLETED. CREATED_INCOMPLETE is the
    // half-state a linked pedido without its completion stamp lands in — the app
    // never repairs it; an engineer diagnoses it. See the plan, "The pedido
    // completion marker".
    @ResolveField(() => OrderQuotationPedidoStepState)
    async order_request_step_state(
        @Parent() orderQuotation: OrderQuotation,
    ): Promise<OrderQuotationPedidoStepState> {
        return this.service.getPedidoStepState(orderQuotation);
    }

    // The LIVE pedido this quotation converted into (active: 1), the UI's
    // navigation target — a different query from order_request_step_done, which
    // asks "was one ever created" ignoring active. Same column, two filters.
    @ResolveField(() => OrderRequest, { nullable: true })
    async order_request(
        @Parent() orderQuotation: OrderQuotation,
    ): Promise<OrderRequest | null> {
        return this.service.getConvertedOrderRequest({
            order_quotation_id: orderQuotation.id,
        });
    }

    @ResolveField(() => Boolean)
    async is_deletable(
        @Parent() orderQuotation: OrderQuotation,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        return this.service.isDeletable({
            order_quotation_id: orderQuotation.id,
            current_user_id: currentUser.id,
        });
    }

    @ResolveField(() => Boolean)
    async is_editable(
        @Parent() orderQuotation: OrderQuotation,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        return this.service.isEditable({
            order_quotation_id: orderQuotation.id,
            current_user_id: currentUser.id,
        });
    }

    @ResolveField(() => Account, { nullable: true })
    async account(
        @Parent() orderQuotation: OrderQuotation,
    ): Promise<Account | null> {
        return this.service.getAccount({
            account_id: orderQuotation.account_id,
        });
    }

    @ResolveField(() => OrderQuotationStatus, { nullable: true })
    async order_quotation_status(
        @Parent() orderQuotation: OrderQuotation,
    ): Promise<OrderQuotationStatus | null> {
        return this.service.getOrderQuotationStatus({
            order_quotation_status_id:
                orderQuotation.order_quotation_status_id,
        });
    }

    @ResolveField(() => User, { nullable: true })
    async created_by(
        @Parent() orderQuotation: OrderQuotation,
    ): Promise<User | null> {
        return this.auditUsersService.getCreatedBy({
            created_by_id: orderQuotation.created_by_id,
        });
    }

    @ResolveField(() => User, { nullable: true })
    async updated_by(
        @Parent() orderQuotation: OrderQuotation,
    ): Promise<User | null> {
        return this.auditUsersService.getUpdatedBy({
            updated_by_id: orderQuotation.updated_by_id,
        });
    }

    @Subscription(() => OrderQuotation)
    order_quotation() {
        return this.pubSubService.listenForOrderQuotation();
    }
}
