import {
    ArgsType,
    Field,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';

export enum ActivityEntityName {
    ORDER_PRODUCTION = 'orderProductions',
    ORDER_SALE = 'orderSales',
    ORDER_REQUEST = 'orderRequests',
    ORDER_QUOTATION = 'orderQuotations',
    PRODUCT = 'products',
    EMPLOYEE = 'employees',
    ORDER_ADJUSTMENT = 'orderAdjustments',
    ACCOUNT = 'accounts',
    ACCOUNT_PRODUCT = 'accountProducts',
    MACHINE = 'machines',
    USER = 'users',
    TRANSFER = 'transfers',
    RESOURCE = 'resource',
    EXPENSE = 'expenses',
    EXPENSE_RESOURCE = 'expenseResources',
    PRODUCTION_PLAN = 'productionPlans',
}

registerEnumType(ActivityEntityName, {
    name: 'ActivityEntityName',
});

export enum ActivityTypeName {
    UPDATE = 'update',
    DELETE = 'delete',
    CREATE = 'create',
}

registerEnumType(ActivityTypeName, {
    name: 'ActivityTypeName',
});

/**
 * Why a NULL snapshot happened — the one audit signal that leaves the server.
 *
 * Recording an activity is best effort: the entity write is authoritative and
 * nothing here may fail it. So when capture does fail, the only honest thing
 * left is to say so, and this is the vocabulary for that. Two NULL JSON columns
 * on their own are ambiguous between three unrelated situations, and only one
 * of them is a problem.
 *
 * `complete` is operation-aware: a create legitimately has no `old_data` and a
 * delete legitimately has no `new_data`. Absence by design is still complete.
 *
 * Deliberately carries NO exception text. Raw errors go to the structured
 * server log only — they can name tables, columns and connection strings, and
 * an audit reader has no action to take on them.
 */
export enum ActivitySnapshotStatus {
    /** Every required side was captured. Render the diff. */
    COMPLETE = 'complete',
    /** The entity saved; capturing its snapshots did not. Both columns NULL. */
    CAPTURE_FAILED = 'capture_failed',
    /** This entity has no detailed snapshots yet, by decision. Both NULL. */
    NOT_SUPPORTED = 'not_supported',
    /** Written before detailed history existed. Whatever the row already has. */
    LEGACY = 'legacy',
}

registerEnumType(ActivitySnapshotStatus, {
    name: 'ActivitySnapshotStatus',
});

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ActivityBase {
    @Field(() => ActivityEntityName, { nullable: false })
    entity_name: string | ActivityEntityName;

    @Field(() => ActivityTypeName, { nullable: false })
    type: string | ActivityTypeName;

    @Field(() => Int, { nullable: false })
    entity_id: number;

    // A record IDENTIFIER frozen at write time — "1042 (F103) · ACME" — not a
    // sentence and not a change summary. The snapshots answer what changed;
    // this answers which record, in the one column the feed can afford. It is
    // also all that survives a hard delete. Built by ActivityTitleService.
    @Field({ nullable: false })
    title: string;
}

@ObjectType('ActivityInput')
export class ActivityInput extends ActivityBase {}

@ObjectType('Activity')
export class Activity extends ActivityBase {
    // The activity's own primary key. Previously unexposed — the feed only
    // needed the entity it pointed at — but the audit dialog fetches snapshots
    // by activity id, so the list has to be able to select it.
    @Field(() => Int, { nullable: false })
    id: number;

    @Field(() => Date, { nullable: true })
    created_at: Date | null;

    // Audit snapshots, serialized. The database column is MySQL JSON, but the
    // GraphQL field is a String on purpose: adding a JSON scalar would mean a
    // new dependency, and this repo's install is fragile enough that a lockfile
    // re-resolve has broken `nest start` before (see the install reference in
    // docs/memory). One JSON.stringify here and one JSON.parse in React is a
    // cheaper trade than that risk.
    //
    // `old_data` is null on a create, `new_data` is null on a delete.
    @Field(() => String, { nullable: true })
    old_data: string | null;

    @Field(() => String, { nullable: true })
    new_data: string | null;

    // Why the two fields above are null when they are. The UI renders BY THIS
    // VALUE rather than inferring intent from nullable JSON: "no snapshots"
    // used to mean "legacy row", and once capture became best-effort it could
    // also mean "the save worked but the history did not" — a warning, not a
    // shrug. Never null: the column is NOT NULL DEFAULT 'legacy'.
    @Field(() => ActivitySnapshotStatus, { nullable: false })
    snapshot_status: ActivitySnapshotStatus;

    // NOTE: `user` (who performed the change) is exposed as a @ResolveField on
    // ActivitiesResolver rather than declared here, matching how OrderSale
    // handles created_by / updated_by. Keeps DTO-to-DTO imports out of the
    // entities barrel.
}

@ObjectType()
export class PaginatedActivities extends OffsetPaginatorResult(Activity) {}

@ArgsType()
export class ActivitiesQueryArgs {
    @Field(() => ActivityEntityName, { nullable: true })
    entity_name: ActivityEntityName | null;

    @Field(() => ActivityTypeName, { nullable: true })
    type: ActivityTypeName | null;

    @Field(() => Int, { nullable: true })
    user_id: number | null;
}
