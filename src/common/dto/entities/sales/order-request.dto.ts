import {
    ArgsType,
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { OrderRequestProductInput } from './order-request-product.dto';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';
import { ColumnOrder } from '../../pagination';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderRequestBase {
    @Field({ nullable: false })
    date: Date;

    @Field()
    order_code: number;

    @Field(() => Date, { nullable: true })
    estimated_delivery_date: Date | null;

    @Field(() => Int, { nullable: true })
    account_id?: number | null;

    @Field(() => String, { nullable: false })
    notes: string;
}

@InputType('OrderRequestInput')
export class OrderRequestInput extends OrderRequestBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [OrderRequestProductInput])
    order_request_products: OrderRequestProductInput[];
}

// One entry in a batch priority reorder. The board renumbers a whole status
// bucket in a single drag, so it sends the full list of changed rows at once.
// `priority` stays Float to match the column's existing type.
@InputType('OrderRequestPriorityInput')
export class OrderRequestPriorityInput {
    @Field(() => Int)
    order_request_id: number;

    @Field(() => Float)
    priority: number;
}

@ObjectType('OrderRequest')
export class OrderRequest extends OrderRequestBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Date, { nullable: true })
    updated_at?: Date | null;

    // Status is read here but never accepted on OrderRequestInput: upserts
    // default it to 1 and only the admin-only updateOrderRequestStatus mutation
    // can change it.
    @Field(() => Int, { nullable: true })
    order_request_status_id?: number | null;
}

@ArgsType()
export class GetOrderRequestsArgs {
    @Field(() => [Int], { nullable: true })
    order_request_status_ids?: number[] | null;
}

@ObjectType()
export class PaginatedOrderRequests extends OffsetPaginatorResult(
    OrderRequest,
) {}

@ArgsType()
export class PaginatedOrderRequestsQueryArgs {
    @Field(() => String, { nullable: true })
    filter: string;

    @Field(() => Int, { nullable: true })
    account_id: number | null;

    @Field(() => Int, { nullable: true })
    order_request_status_id: number | null;
}

export enum OrderRequestsSortableFields {
    order_code = 'order_code',
    estimated_delivery_date = 'estimated_delivery_date',
    date = 'date',
}

registerEnumType(OrderRequestsSortableFields, {
    name: 'OrderRequestsSortableFields',
});

@ArgsType()
export class OrderRequestsSortArgs {
    @Field(() => ColumnOrder, { nullable: true })
    sort_order: ColumnOrder | null;

    @Field(() => OrderRequestsSortableFields, { nullable: true })
    sort_field: OrderRequestsSortableFields | null;
}
