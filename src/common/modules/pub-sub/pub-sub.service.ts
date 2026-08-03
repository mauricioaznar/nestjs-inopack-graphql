import { Injectable, Logger } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import {
    Account,
    ActivityEntityName,
    ActivityTypeName,
    Expense,
    ExpenseResource,
    Machine,
    OrderRequest,
    OrderSale,
    Product,
    Resource,
    Transfer,
    User,
} from '../../dto/entities';
import { OrderProduction } from '../../dto/entities/production/order-production.dto';
import { OrderAdjustment } from '../../dto/entities/production/order-adjustment.dto';
import { Employee } from '../../dto/entities/production/employee.dto';
import { ActivityTitleService } from './activity-title.service';

// The title is passed as a BUILDER, not as a finished string, so that building
// it happens inside publishActivity's guard. Six of the fourteen titles hit the
// database to resolve a counterpart name (see activity-title.service.ts), and a
// failed lookup must not turn a saved entity into a GraphQL error.
type ActivityTitleBuilder = () => string | Promise<string>;

// Which part of the best-effort audit path failed, for the log line.
type ActivityStage = 'title' | 'insert' | 'notification';

@Injectable()
export class PubSubService {
    private pubSub: PubSub;

    private readonly logger = new Logger(PubSubService.name);

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
        oldData,
        newData,
    }: {
        product: Product;
        type: ActivityTypeName;
        userId: number;
        // Audit snapshots. Optional so that any caller not yet wired keeps
        // compiling and simply records no snapshot.
        oldData?: unknown;
        newData?: unknown;
    }) {
        await this.pubSub.publish('product', { product: product });
        await this.publishActivity({
            entity_name: ActivityEntityName.PRODUCT,
            type: type,
            entity_id: product.id,
            userId,
            title: () => this.activityTitle.product(product),
            oldData,
            newData,
        });
    }

    async orderProduction({
        orderProduction,
        type,
        userId,
        oldData,
        newData,
    }: {
        orderProduction: OrderProduction;
        type: ActivityTypeName;
        userId: number;
        // Audit snapshots. Optional so that any caller not yet wired keeps
        // compiling and simply records no snapshot.
        oldData?: unknown;
        newData?: unknown;
    }) {
        await this.pubSub.publish('order_production', {
            order_production: orderProduction,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_PRODUCTION,
            type: type,
            entity_id: orderProduction.id,
            userId,
            title: () => this.activityTitle.orderProduction(orderProduction),
            oldData,
            newData,
        });
    }

    async machine({
        machine,
        type,
        userId,
        oldData,
        newData,
    }: {
        machine: Machine;
        type: ActivityTypeName;
        userId: number;
        // Audit snapshots. Optional so that any caller not yet wired keeps
        // compiling and simply records no snapshot.
        oldData?: unknown;
        newData?: unknown;
    }) {
        await this.pubSub.publish('machine', {
            machine: machine,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.MACHINE,
            type: type,
            entity_id: machine.id,
            userId,
            title: () => this.activityTitle.machine(machine),
            oldData,
            newData,
        });
    }

    async orderAdjustment({
        orderAdjustment,
        type,
        userId,
        oldData,
        newData,
    }: {
        orderAdjustment: OrderAdjustment;
        type: ActivityTypeName;
        userId: number;
        // Audit snapshots. Optional so that any caller not yet wired keeps
        // compiling and simply records no snapshot.
        oldData?: unknown;
        newData?: unknown;
    }) {
        await this.pubSub.publish('order_adjustment', {
            order_adjustment: orderAdjustment,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_ADJUSTMENT,
            type: type,
            entity_id: orderAdjustment.id,
            userId,
            title: () => this.activityTitle.orderAdjustment(orderAdjustment),
            oldData,
            newData,
        });
    }

    async employee({
        employee,
        type,
        userId,
        oldData,
        newData,
    }: {
        employee: Employee;
        type: ActivityTypeName;
        userId: number;
        // Audit snapshots. Optional so that any caller not yet wired keeps
        // compiling and simply records no snapshot.
        oldData?: unknown;
        newData?: unknown;
    }) {
        await this.pubSub.publish('employee', {
            employee: employee,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.EMPLOYEE,
            type: type,
            entity_id: employee.id,
            userId,
            title: () => this.activityTitle.employee(employee),
            oldData,
            newData,
        });
    }

    async account({
        account,
        type,
        userId,
        oldData,
        newData,
    }: {
        account: Account;
        type: ActivityTypeName;
        userId: number;
        // Audit snapshots. Optional so that any caller not yet wired keeps
        // compiling and simply records no snapshot.
        oldData?: unknown;
        newData?: unknown;
    }) {
        await this.pubSub.publish('account', {
            account: account,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.ACCOUNT,
            type: type,
            entity_id: account.id,
            userId,
            title: () => this.activityTitle.account(account),
            oldData,
            newData,
        });
    }

    async user({
        user,
        type,
        userId,
        oldData,
        newData,
    }: {
        user: User;
        type: ActivityTypeName;
        userId: number;
        // Audit snapshots. Optional so that any caller not yet wired keeps
        // compiling and simply records no snapshot.
        //
        // NOTE: the users table holds `password` and `remember_token`. Callers
        // MUST pass getUserSnapshot() output, never a raw users row — see
        // user.service.ts for the explicit safe-column select.
        oldData?: unknown;
        newData?: unknown;
    }) {
        await this.pubSub.publish('user', {
            user: user,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.USER,
            type: type,
            entity_id: user.id,
            userId,
            title: () => this.activityTitle.user(user),
            oldData,
            newData,
        });
    }

    async orderRequest({
        orderRequest,
        type,
        userId,
        oldData,
        newData,
    }: {
        orderRequest: OrderRequest;
        type: ActivityTypeName;
        userId: number;
        // Audit snapshots. Optional so that any caller not yet wired keeps
        // compiling and simply records no snapshot.
        oldData?: unknown;
        newData?: unknown;
    }) {
        await this.pubSub.publish('order_request', {
            order_request: orderRequest,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_REQUEST,
            type: type,
            entity_id: orderRequest.id,
            userId,
            title: () => this.activityTitle.orderRequest(orderRequest),
            oldData,
            newData,
        });
    }

    async orderSale({
        orderSale,
        type,
        userId,
        oldData,
        newData,
    }: {
        orderSale: OrderSale;
        type: ActivityTypeName;
        userId: number;
        // Audit snapshots. Optional so that any caller not yet wired keeps
        // compiling and simply records no snapshot.
        oldData?: unknown;
        newData?: unknown;
    }) {
        await this.pubSub.publish('order_sale', {
            order_sale: orderSale,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_SALE,
            type: type,
            entity_id: orderSale.id,
            userId,
            title: () => this.activityTitle.orderSale(orderSale),
            oldData,
            newData,
        });
    }

    async transfer({
        transfer,
        type,
        userId,
        oldData,
        newData,
    }: {
        transfer: Transfer;
        type: ActivityTypeName;
        userId: number;
        // Audit snapshots. Optional so that any caller not yet wired keeps
        // compiling and simply records no snapshot.
        oldData?: unknown;
        newData?: unknown;
    }) {
        await this.pubSub.publish('transfer', {
            transfer: transfer,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.TRANSFER,
            type: type,
            entity_id: transfer.id,
            userId,
            oldData,
            newData,
            title: () => this.activityTitle.transfer(transfer),
        });
    }

    async resource({
        resource,
        type,
        userId,
        oldData,
        newData,
    }: {
        resource: Resource;
        type: ActivityTypeName;
        userId: number;
        // Audit snapshots. Optional so that any caller not yet wired keeps
        // compiling and simply records no snapshot.
        oldData?: unknown;
        newData?: unknown;
    }) {
        await this.pubSub.publish('resource', {
            resource: resource,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.RESOURCE,
            type: type,
            entity_id: resource.id,
            userId,
            title: () => this.activityTitle.resource(resource),
            oldData,
            newData,
        });
    }

    async expense({
        expense,
        type,
        userId,
        oldData,
        newData,
    }: {
        expense: Expense;
        type: ActivityTypeName;
        userId: number;
        // Audit snapshots. Optional so that any caller not yet wired keeps
        // compiling and simply records no snapshot.
        oldData?: unknown;
        newData?: unknown;
    }) {
        await this.pubSub.publish('expense', {
            expense: expense,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.EXPENSE,
            type: type,
            entity_id: expense.id,
            userId,
            oldData,
            newData,
            title: () => this.activityTitle.expense(expense),
        });
    }

    async expenseResource({
        expenseResource,
        type,
        userId,
    }: {
        expenseResource: ExpenseResource;
        type: ActivityTypeName;
        userId: number;
    }) {
        await this.pubSub.publish('expense_resource', {
            expense_resource: expenseResource,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.EXPENSE_RESOURCE,
            type: type,
            entity_id: expenseResource.id,
            userId,
            title: () => this.activityTitle.expenseResource(expenseResource),
        });
    }

    // Production plans have no subscription topic (nothing listens for one), so
    // unlike its siblings this wrapper only writes the activity. It exists so
    // that every entity's title is built in one place — the resolver used to
    // call publishActivity directly and interpolate a raw Date.
    //
    // No snapshots yet: the diff path walker only reads two path segments and
    // production plans are the only entity with two-level nesting, so wiring
    // them would ship a quietly wrong audit view (§6.6, "Deferred").
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
        });
    }

    /**
     * Records one activity. **Audit recording is best effort.**
     *
     * The entity save is authoritative: by the time any wrapper reaches here the
     * mutation has already committed its own write, so a failure to build the
     * title, insert the activity row or publish the notification must NOT turn a
     * successful mutation into a GraphQL error. All three are therefore caught
     * here — the one place every entity funnels through — and logged with enough
     * context to find the record afterwards.
     *
     * What this deliberately does NOT do:
     *
     * - It does not swallow entity-save failures. Those happen in the calling
     *   service, outside this method, and still propagate.
     * - It does not roll back a saved entity when the audit write fails. An audit
     *   log that can veto the operation it audits is worse than a gap in the log.
     * - It does not serialize concurrent audit capture. Two mutations racing on
     *   the same record can still interleave their snapshots; that is a known,
     *   deferred limitation (see the feature doc).
     *
     * The notification is published only after a successful insert — it sits
     * after the `create` in the same try, so a failed insert throws before it and
     * clients never see an activity that was not written.
     */
    async publishActivity({
        entity_id,
        entity_name,
        type,
        userId,
        title,
        oldData,
        newData,
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
        // Every entity funnels through here, so all activities CAN carry
        // snapshots; only the wired entities actually pass them. Undefined
        // leaves the column NULL rather than writing JSON null.
        oldData?: unknown;
        newData?: unknown;
    }) {
        let stage: ActivityStage = 'title';

        try {
            const activityTitle = await title();

            stage = 'insert';
            const activity = await this.prisma.activities.create({
                data: {
                    entity_name: entity_name,
                    title: activityTitle,
                    created_at: new Date(),
                    updated_at: new Date(),
                    entity_id: entity_id,
                    type: type,
                    user_id: userId,
                    // Omitted rather than set to null: this is a create, so an
                    // absent field leaves the column at its NULL default. Passing a
                    // literal null to a Prisma `Json?` field is rejected — Prisma
                    // wants Prisma.DbNull / Prisma.JsonNull to disambiguate SQL NULL
                    // from JSON null — and omitting sidesteps that entirely.
                    old_data:
                        oldData === undefined || oldData === null
                            ? undefined
                            : (oldData as any),
                    new_data:
                        newData === undefined || newData === null
                            ? undefined
                            : (newData as any),
                },
            });

            stage = 'notification';
            await this.pubSub.publish('activity', { activity: activity });
        } catch (error) {
            this.logActivityFailure({
                stage,
                entity_name,
                entity_id,
                type,
                userId,
                error,
            });
        }
    }

    /**
     * The single log line for a best-effort audit failure. It carries what is
     * needed to reconstruct the missing entry by hand: which entity, which row,
     * what kind of change, who made it — plus the original error.
     */
    private logActivityFailure({
        stage,
        entity_name,
        entity_id,
        type,
        userId,
        error,
    }: {
        stage: ActivityStage;
        entity_name: ActivityEntityName;
        entity_id: number;
        type: ActivityTypeName;
        userId: number;
        error: unknown;
    }) {
        // The entity change is already saved in every case; what is lost differs
        // by stage, and saying which keeps the log from over- or under-stating it.
        const consequence =
            stage === 'notification'
                ? 'the activity row WAS written; only the live notification is missing'
                : 'no activity row was written';

        this.logger.error(
            `Activity ${stage} failed for entity ${entity_name} id ${entity_id} ` +
                `(type ${type}, user ${userId}). The entity change itself was saved; ` +
                `${consequence}. Original error: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            error instanceof Error ? error.stack : undefined,
        );
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
