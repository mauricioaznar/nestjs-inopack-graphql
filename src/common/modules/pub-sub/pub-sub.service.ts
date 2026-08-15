import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import {
    Account,
    ActivityEntityName,
    ActivityTypeName,
    Expense,
    ExpenseComment,
    ExpenseResource,
    Machine,
    OrderQuotation,
    OrderRequest,
    OrderSale,
    OrderSaleComment,
    Product,
    Resource,
    Transfer,
    User,
} from '../../dto/entities';
import { OrderProduction } from '../../dto/entities/production/order-production.dto';
import { OrderAdjustment } from '../../dto/entities/production/order-adjustment.dto';
import { Employee } from '../../dto/entities/production/employee.dto';
import { ActivityTitleService } from './activity-title.service';
import {
    ActivityLogContext,
    ActivitySnapshots,
    logAuditFailure,
    resolveSnapshots,
    SNAPSHOTS_NOT_SUPPORTED,
    SnapshotCapture,
} from './activity-audit';

// The title is passed as a BUILDER, not as a finished string, so that building
// it happens inside publishActivity's guard. Six of the fourteen titles hit the
// database to resolve a counterpart name (see activity-title.service.ts), and a
// failed lookup must not turn a saved entity into a GraphQL error.
type ActivityTitleBuilder = () => string | Promise<string>;

/**
 * The one policy boundary for entity notifications and audit recording.
 *
 * Everything in this service is BEST EFFORT. By the time any wrapper is called
 * the entity write has already committed, so a failure to notify, to build a
 * title, to insert the activity row or to publish it may not be allowed to
 * surface as a mutation error — see activity-audit.ts for the reasoning and for
 * the call-site half of the same boundary.
 *
 * The wrappers take CAPTURE RESULTS rather than raw snapshots, and they are
 * required rather than optional. Optional snapshot arguments were what let a
 * call site stay half-wired without a compile error; a required
 * `SnapshotCapture` makes "I did not capture anything" impossible to say by
 * accident — only `INTENTIONALLY_ABSENT` says it, and it says it on purpose.
 */
@Injectable()
export class PubSubService {
    private pubSub: PubSub;

    constructor(
        private prisma: PrismaService,
        private activityTitle: ActivityTitleService,
    ) {
        this.pubSub = new PubSub();
    }

    async product({
        product,
        type,
        userId,
        oldCapture,
        newCapture,
    }: {
        product: Product;
        type: ActivityTypeName;
        userId: number;
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
    }) {
        const context: ActivityLogContext = {
            entityName: ActivityEntityName.PRODUCT,
            entityId: product.id,
            activityType: type,
            userId,
        };
        await this.publishEntity('product', { product: product }, context);
        await this.publishActivity({
            entity_name: ActivityEntityName.PRODUCT,
            type: type,
            entity_id: product.id,
            userId,
            title: () => this.activityTitle.product(product),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    async orderProduction({
        orderProduction,
        type,
        userId,
        oldCapture,
        newCapture,
    }: {
        orderProduction: OrderProduction;
        type: ActivityTypeName;
        userId: number;
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
    }) {
        const context: ActivityLogContext = {
            entityName: ActivityEntityName.ORDER_PRODUCTION,
            entityId: orderProduction.id,
            activityType: type,
            userId,
        };
        await this.publishEntity(
            'order_production',
            { order_production: orderProduction },
            context,
        );
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_PRODUCTION,
            type: type,
            entity_id: orderProduction.id,
            userId,
            title: () => this.activityTitle.orderProduction(orderProduction),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    async machine({
        machine,
        type,
        userId,
        oldCapture,
        newCapture,
    }: {
        machine: Machine;
        type: ActivityTypeName;
        userId: number;
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
    }) {
        const context: ActivityLogContext = {
            entityName: ActivityEntityName.MACHINE,
            entityId: machine.id,
            activityType: type,
            userId,
        };
        await this.publishEntity('machine', { machine: machine }, context);
        await this.publishActivity({
            entity_name: ActivityEntityName.MACHINE,
            type: type,
            entity_id: machine.id,
            userId,
            title: () => this.activityTitle.machine(machine),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    async orderAdjustment({
        orderAdjustment,
        type,
        userId,
        oldCapture,
        newCapture,
    }: {
        orderAdjustment: OrderAdjustment;
        type: ActivityTypeName;
        userId: number;
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
    }) {
        const context: ActivityLogContext = {
            entityName: ActivityEntityName.ORDER_ADJUSTMENT,
            entityId: orderAdjustment.id,
            activityType: type,
            userId,
        };
        await this.publishEntity(
            'order_adjustment',
            { order_adjustment: orderAdjustment },
            context,
        );
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_ADJUSTMENT,
            type: type,
            entity_id: orderAdjustment.id,
            userId,
            title: () => this.activityTitle.orderAdjustment(orderAdjustment),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    async employee({
        employee,
        type,
        userId,
        oldCapture,
        newCapture,
    }: {
        employee: Employee;
        type: ActivityTypeName;
        userId: number;
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
    }) {
        const context: ActivityLogContext = {
            entityName: ActivityEntityName.EMPLOYEE,
            entityId: employee.id,
            activityType: type,
            userId,
        };
        await this.publishEntity('employee', { employee: employee }, context);
        await this.publishActivity({
            entity_name: ActivityEntityName.EMPLOYEE,
            type: type,
            entity_id: employee.id,
            userId,
            title: () => this.activityTitle.employee(employee),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    async account({
        account,
        type,
        userId,
        oldCapture,
        newCapture,
        title,
    }: {
        account: Account;
        type: ActivityTypeName;
        userId: number;
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
        // Optional title override — the title reaches publishActivity as a
        // thunk precisely so it is injectable per call site. The cotización
        // acceptance path passes one that names the cotización for provenance;
        // every other caller omits it and gets the default account title.
        title?: () => string | Promise<string>;
    }) {
        const context: ActivityLogContext = {
            entityName: ActivityEntityName.ACCOUNT,
            entityId: account.id,
            activityType: type,
            userId,
        };
        await this.publishEntity('account', { account: account }, context);
        await this.publishActivity({
            entity_name: ActivityEntityName.ACCOUNT,
            type: type,
            entity_id: account.id,
            userId,
            title: title ?? (() => this.activityTitle.account(account)),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    async user({
        user,
        type,
        userId,
        oldCapture,
        newCapture,
    }: {
        user: User;
        type: ActivityTypeName;
        userId: number;
        // NOTE: the users table holds `password` and `remember_token`. Callers
        // MUST capture getUserSnapshot() output, never a raw users row — see
        // user.service.ts for the explicit safe-column select.
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
    }) {
        const context: ActivityLogContext = {
            entityName: ActivityEntityName.USER,
            entityId: user.id,
            activityType: type,
            userId,
        };
        await this.publishEntity('user', { user: user }, context);
        await this.publishActivity({
            entity_name: ActivityEntityName.USER,
            type: type,
            entity_id: user.id,
            userId,
            title: () => this.activityTitle.user(user),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    async orderRequest({
        orderRequest,
        type,
        userId,
        oldCapture,
        newCapture,
    }: {
        orderRequest: OrderRequest;
        type: ActivityTypeName;
        userId: number;
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
    }) {
        const context: ActivityLogContext = {
            entityName: ActivityEntityName.ORDER_REQUEST,
            entityId: orderRequest.id,
            activityType: type,
            userId,
        };
        await this.publishEntity(
            'order_request',
            { order_request: orderRequest },
            context,
        );
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_REQUEST,
            type: type,
            entity_id: orderRequest.id,
            userId,
            title: () => this.activityTitle.orderRequest(orderRequest),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    async orderQuotation({
        orderQuotation,
        type,
        userId,
        oldCapture,
        newCapture,
    }: {
        orderQuotation: OrderQuotation;
        type: ActivityTypeName;
        userId: number;
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
    }) {
        const context: ActivityLogContext = {
            entityName: ActivityEntityName.ORDER_QUOTATION,
            entityId: orderQuotation.id,
            activityType: type,
            userId,
        };
        await this.publishEntity(
            'order_quotation',
            { order_quotation: orderQuotation },
            context,
        );
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_QUOTATION,
            type: type,
            entity_id: orderQuotation.id,
            userId,
            title: () => this.activityTitle.orderQuotation(orderQuotation),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    async orderSale({
        orderSale,
        type,
        userId,
        oldCapture,
        newCapture,
    }: {
        orderSale: OrderSale;
        type: ActivityTypeName;
        userId: number;
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
    }) {
        const context: ActivityLogContext = {
            entityName: ActivityEntityName.ORDER_SALE,
            entityId: orderSale.id,
            activityType: type,
            userId,
        };
        await this.publishEntity(
            'order_sale',
            { order_sale: orderSale },
            context,
        );
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_SALE,
            type: type,
            entity_id: orderSale.id,
            userId,
            title: () => this.activityTitle.orderSale(orderSale),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    async transfer({
        transfer,
        type,
        userId,
        oldCapture,
        newCapture,
    }: {
        transfer: Transfer;
        type: ActivityTypeName;
        userId: number;
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
    }) {
        const context: ActivityLogContext = {
            entityName: ActivityEntityName.TRANSFER,
            entityId: transfer.id,
            activityType: type,
            userId,
        };
        await this.publishEntity('transfer', { transfer: transfer }, context);
        await this.publishActivity({
            entity_name: ActivityEntityName.TRANSFER,
            type: type,
            entity_id: transfer.id,
            userId,
            title: () => this.activityTitle.transfer(transfer),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    async resource({
        resource,
        type,
        userId,
        oldCapture,
        newCapture,
    }: {
        resource: Resource;
        type: ActivityTypeName;
        userId: number;
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
    }) {
        const context: ActivityLogContext = {
            entityName: ActivityEntityName.RESOURCE,
            entityId: resource.id,
            activityType: type,
            userId,
        };
        await this.publishEntity('resource', { resource: resource }, context);
        await this.publishActivity({
            entity_name: ActivityEntityName.RESOURCE,
            type: type,
            entity_id: resource.id,
            userId,
            title: () => this.activityTitle.resource(resource),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    async expense({
        expense,
        type,
        userId,
        oldCapture,
        newCapture,
    }: {
        expense: Expense;
        type: ActivityTypeName;
        userId: number;
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
    }) {
        const context: ActivityLogContext = {
            entityName: ActivityEntityName.EXPENSE,
            entityId: expense.id,
            activityType: type,
            userId,
        };
        await this.publishEntity('expense', { expense: expense }, context);
        await this.publishActivity({
            entity_name: ActivityEntityName.EXPENSE,
            type: type,
            entity_id: expense.id,
            userId,
            title: () => this.activityTitle.expense(expense),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    // Comments have no entity subscription topic. Their mutations refresh the
    // active parent list and comments query directly in Apollo; this wrapper is
    // solely the canonical activity-audit path.
    async expenseComment({
        comment,
        type,
        userId,
        oldCapture,
        newCapture,
    }: {
        comment: ExpenseComment;
        type: ActivityTypeName;
        userId: number;
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
    }) {
        await this.publishActivity({
            entity_name: ActivityEntityName.EXPENSE_COMMENT,
            type,
            entity_id: comment.id,
            userId,
            title: () => this.activityTitle.expenseComment(comment),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    async orderSaleComment({
        comment,
        type,
        userId,
        oldCapture,
        newCapture,
    }: {
        comment: OrderSaleComment;
        type: ActivityTypeName;
        userId: number;
        oldCapture: SnapshotCapture;
        newCapture: SnapshotCapture;
    }) {
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_SALE_COMMENT,
            type,
            entity_id: comment.id,
            userId,
            title: () => this.activityTitle.orderSaleComment(comment),
            snapshots: { supported: true, old: oldCapture, new: newCapture },
        });
    }

    // Snapshots are `not_supported` rather than absent: this wrapper has no
    // callers at all (feature doc §6.6, "Dead entries found"), so there is no
    // getExpenseResourceSnapshot to capture. If it is ever wired, wire the
    // captures at the same time — an unsupported status is a promise to the
    // reader that nothing was lost, and it must stay true.
    async expenseResource({
        expenseResource,
        type,
        userId,
    }: {
        expenseResource: ExpenseResource;
        type: ActivityTypeName;
        userId: number;
    }) {
        const context: ActivityLogContext = {
            entityName: ActivityEntityName.EXPENSE_RESOURCE,
            entityId: expenseResource.id,
            activityType: type,
            userId,
        };
        await this.publishEntity(
            'expense_resource',
            { expense_resource: expenseResource },
            context,
        );
        await this.publishActivity({
            entity_name: ActivityEntityName.EXPENSE_RESOURCE,
            type: type,
            entity_id: expenseResource.id,
            userId,
            title: () => this.activityTitle.expenseResource(expenseResource),
            snapshots: SNAPSHOTS_NOT_SUPPORTED,
        });
    }

    // Production plans have no subscription topic (nothing listens for one), so
    // unlike its siblings this wrapper only writes the activity. It exists so
    // that every entity's title is built in one place — the resolver used to
    // call publishActivity directly and interpolate a raw Date.
    //
    // `not_supported`, not `capture_failed`: the diff path walker only reads two
    // path segments and production plans are the only entity with two-level
    // nesting, so wiring them would ship a quietly wrong audit view (§6.6). The
    // reader is told the history does not exist for this record type, which is
    // true, rather than being shown a warning about a failure that never
    // happened.
    async productionPlan({
        productionPlan,
        type,
        userId,
    }: {
        productionPlan: { id: number; date: Date; shift?: number | null };
        type: ActivityTypeName;
        userId: number;
    }) {
        await this.publishActivity({
            entity_name: ActivityEntityName.PRODUCTION_PLAN,
            type: type,
            entity_id: productionPlan.id,
            userId,
            title: () => this.activityTitle.productionPlan(productionPlan),
            snapshots: SNAPSHOTS_NOT_SUPPORTED,
        });
    }

    /**
     * Publishes one entity subscription.
     *
     * Separate from the activity path on purpose: an entity subscription
     * represents a COMMITTED ENTITY CHANGE and is independent of whether an
     * activity row was recorded. It is still best effort — a websocket failure
     * costs a live cache refresh, never the save.
     */
    private async publishEntity(
        topic: string,
        payload: Record<string, unknown>,
        context: ActivityLogContext,
    ) {
        try {
            await this.pubSub.publish(topic, payload);
        } catch (error) {
            logAuditFailure({ phase: 'entity_notification', context, error });
        }
    }

    /**
     * Records one activity. **Audit recording is best effort.**
     *
     * By the time any wrapper reaches here the mutation has already committed
     * its own write, so every step below is guarded individually — not by one
     * outer try, which could not tell an insert failure from a title failure or
     * decide what each one costs.
     *
     * The four guarded steps, and what each is allowed to degrade to:
     *
     * 1. **title** — falls back to `#<entity_id>`. A missing counterpart name is
     *    not a reason to lose the whole row: who changed what and when is the
     *    part that cannot be reconstructed later.
     * 2. **snapshot status** — already decided by the call site's captures; a
     *    failed capture becomes a metadata-only `capture_failed` row rather than
     *    no row at all.
     * 3. **insert** — nothing left to degrade to. There is no activity to mark,
     *    so the structured log is the only truthful record, and we return
     *    WITHOUT publishing: clients must never see an activity that does not
     *    exist.
     * 4. **subscription** — the row is already durable, so this costs only the
     *    live toast and cache refresh. It appears on the next refresh.
     *
     * What this deliberately does NOT do:
     *
     * - It does not swallow entity-save failures. Those happen in the calling
     *   service, outside this method, and still propagate.
     * - It does not roll back a saved entity when the audit write fails. An
     *   audit log that can veto the operation it audits is worse than a gap.
     * - It does not serialize concurrent audit capture. Two mutations racing on
     *   the same record can still interleave their snapshots; that is a known,
     *   deferred limitation (see the feature doc).
     */
    async publishActivity({
        entity_id,
        entity_name,
        type,
        userId,
        title,
        snapshots,
    }: {
        entity_id: number;
        entity_name: ActivityEntityName;
        type: ActivityTypeName;
        userId: number;
        // A record IDENTIFIER, not a sentence — always built by
        // ActivityTitleService so the entities cannot drift apart again.
        // See activity-title.service.ts. Passed as a builder so that building it
        // (six titles query the database) is covered by the guard below.
        title: ActivityTitleBuilder;
        // Both capture results, or an explicit "this entity has none". Never a
        // raw snapshot: the difference between "absent by design" and "capture
        // failed" is what decides the status, and a raw value cannot express it.
        snapshots: ActivitySnapshots;
    }) {
        const context: ActivityLogContext = {
            entityName: entity_name,
            entityId: entity_id,
            activityType: type,
            userId,
        };

        const { status, oldData, newData } = resolveSnapshots(snapshots, type);

        let activityTitle: string;
        try {
            activityTitle = await title();
        } catch (error) {
            logAuditFailure({ phase: 'title_lookup', context, error });
            // Not a placeholder for nothing: entity_name + this id is still a
            // resolvable pointer to the record.
            activityTitle = `#${entity_id}`;
        }

        let activity;
        try {
            activity = await this.prisma.activities.create({
                data: {
                    entity_name: entity_name,
                    title: activityTitle,
                    created_at: new Date(),
                    updated_at: new Date(),
                    entity_id: entity_id,
                    type: type,
                    user_id: userId,
                    snapshot_status: status,
                    // Omitted rather than set to null: this is a create, so an
                    // absent field leaves the column at its NULL default. Passing a
                    // literal null to a Prisma `Json?` field is rejected — Prisma
                    // wants Prisma.DbNull / Prisma.JsonNull to disambiguate SQL NULL
                    // from JSON null — and omitting sidesteps that entirely.
                    old_data: oldData === undefined ? undefined : (oldData as any),
                    new_data: newData === undefined ? undefined : (newData as any),
                },
            });
        } catch (error) {
            logAuditFailure({ phase: 'activity_insert', context, error });
            return;
        }

        // Only ever reached with a row that exists.
        try {
            await this.pubSub.publish('activity', { activity: activity });
        } catch (error) {
            logAuditFailure({ phase: 'activity_subscription', context, error });
        }
    }

    async listenForActivity() {
        return this.pubSub.asyncIterator('activity');
    }

    async listenForProduct() {
        return this.pubSub.asyncIterator('product');
    }

    async listenForOrderProduction() {
        return this.pubSub.asyncIterator('order_production');
    }

    async listenForMachine() {
        return this.pubSub.asyncIterator('machine');
    }

    async listenForRawMaterialAddition() {
        return this.pubSub.asyncIterator('raw_material_addition');
    }

    async listenForOrderAdjustment() {
        return this.pubSub.asyncIterator('order_adjustment');
    }

    async listenForEmployee() {
        return this.pubSub.asyncIterator('employee');
    }

    async listenForTransfer() {
        return this.pubSub.asyncIterator('transfer');
    }

    async listenForResource() {
        return this.pubSub.asyncIterator('resource');
    }

    async listenForAccount() {
        return this.pubSub.asyncIterator('account');
    }

    async listenForOrderRequest() {
        return this.pubSub.asyncIterator('order_request');
    }

    async listenForOrderQuotation() {
        return this.pubSub.asyncIterator('order_quotation');
    }

    async listenForOrderSale() {
        return this.pubSub.asyncIterator('order_sale');
    }

    async listenForUser() {
        return this.pubSub.asyncIterator('user');
    }

    async listenForExpense() {
        return this.pubSub.asyncIterator('expense');
    }

    async listenForExpenseResource() {
        return this.pubSub.asyncIterator('expense_resource');
    }
}
