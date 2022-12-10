import {
    ArgsType,
    Field,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { OrderSaleProductInput } from './order-sale-product.dto';
import { OrderSalePaymentInput } from './order-sale-payment.dto';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';
import { ColumnOrder } from '../../pagination';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderSaleBase {
    @Field()
    date: Date;

    @Field(() => Int, { nullable: true })
    order_sale_status_id?: number | null;

    @Field()
    order_code: number;

    @Field()
    invoice_code: number;

    @Field(() => Int, { nullable: true })
    order_sale_receipt_type_id?: number | null;

    @Field(() => Int, { nullable: true })
    order_request_id?: number | null;
}

@InputType('OrderSaleInput')
export class OrderSaleInput extends OrderSaleBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [OrderSaleProductInput])
    order_sale_products: OrderSaleProductInput[];

    @Field(() => [OrderSalePaymentInput])
    order_sale_payments: OrderSalePaymentInput[];

    @Field({ nullable: false })
    order_request_id: number;

    @Field({ nullable: false })
    order_sale_receipt_type_id: number;

    @Field({ nullable: false })
    order_sale_status_id: number;
}

@ObjectType('OrderSale')
export class OrderSale extends OrderSaleBase {
    @Field({ nullable: false })
    id: number;
}

@ObjectType()
export class PaginatedOrderSales extends OffsetPaginatorResult(OrderSale) {}

@ArgsType()
export class OrderSalesQueryArgs {
    @Field(() => String, { nullable: true })
    filter: string;

    @Field(() => Int, { nullable: true })
    client_id: number | null;

    @Field(() => Int, { nullable: true })
    order_sale_receipt_type_id: number | null;
}

export enum OrderSalesSortableFields {
    order_code = 'order_code',
    order_request = 'order_request',
    date = 'date',
}

registerEnumType(OrderSalesSortableFields, {
    name: 'OrderSalesSortableFields',
});

@ArgsType()
export class OrderSalesSortArgs {
    @Field(() => ColumnOrder, { nullable: true })
    sort_order: ColumnOrder | null;

    @Field(() => OrderSalesSortableFields, { nullable: true })
    sort_field: OrderSalesSortableFields | null;
}
