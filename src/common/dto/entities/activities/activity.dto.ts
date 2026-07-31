import {
    Field,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';

export enum ActivityEntityName {
    ORDER_PRODUCTION = 'orderProductions',
    ORDER_SALE = 'orderSales',
    ORDER_REQUEST = 'orderRequests',
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

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ActivityBase {
    @Field(() => ActivityEntityName, { nullable: false })
    entity_name: string | ActivityEntityName;

    @Field(() => ActivityTypeName, { nullable: false })
    type: string | ActivityTypeName;

    @Field(() => Int, { nullable: false })
    entity_id: number;

    @Field({ nullable: false })
    description: string;
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

    // NOTE: `user` (who performed the change) is exposed as a @ResolveField on
    // ActivitiesResolver rather than declared here, matching how OrderSale
    // handles created_by / updated_by. Keeps DTO-to-DTO imports out of the
    // entities barrel.
}
