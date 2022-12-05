import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';

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
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    order_sale_id?: number | null;
}

@ObjectType()
export class PaginatedOrderSalePayments extends OffsetPaginatorResult(
    OrderSalePayment,
) {}
