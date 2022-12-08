import {
    ArgsType,
    Field,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';
import { ColumnOrder } from '../../pagination';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderSalePaymentBase {
    @Field()
    date_paid: Date;

    @Field()
    amount: number;

    @Field(() => Int, { nullable: true })
    order_sale_collection_status_id?: number | null;
}

@InputType('OrderSalePaymentInput')
export class OrderSalePaymentInput extends OrderSalePaymentBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@InputType('OrderSalePaymentUpdateInput')
export class OrderSalePaymentUpdateInput {
    @Field(() => Int, { nullable: false })
    id: number;

    @Field(() => Int, { nullable: false })
    order_sale_collection_status_id: number;
}

@ObjectType('OrderSalePayment')
export class OrderSalePayment extends OrderSalePaymentBase {
    @Field(() => Date, { nullable: true })
    updated_at: Date | null;

    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    order_sale_id?: number | null;
}

@ObjectType()
export class PaginatedOrderSalePayments extends OffsetPaginatorResult(
    OrderSalePayment,
) {}

export enum OrderSalePaymentSortableFields {
    date_paid = 'date_paid',
    order_code = 'order_code',
}

registerEnumType(OrderSalePaymentSortableFields, {
    name: 'OrderSalePaymentSortableFields',
});

@ArgsType()
export class OrderSalePaymentSortArgs {
    @Field(() => ColumnOrder, { nullable: true })
    sort_order: ColumnOrder | null;

    @Field(() => OrderSalePaymentSortableFields, { nullable: true })
    sort_field: OrderSalePaymentSortableFields | null;
}

@ArgsType()
export class OrderSalePaymentQueryArgs {
    @Field(() => String, { nullable: true })
    filter: string;

    @Field(() => Int, { nullable: true })
    order_sale_collection_status_id: number | null;
}
