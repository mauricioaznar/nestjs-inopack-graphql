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
    MACHINE = 'machines',
    USER = 'users',
    EQUIPMENTS = 'equipments',
    TRANSFER = 'transfers',

    EXPENSE = 'expenses',
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
    @Field(() => Date, { nullable: true })
    created_at: Date | null;
}
