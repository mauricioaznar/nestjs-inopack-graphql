import {
    ArgsType,
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { OrderSaleProductInput } from './order-sale-product.dto';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';
import { ColumnOrder } from '../../pagination';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderSaleBase {
    @Field(() => Date, { nullable: false })
    date: Date;

    @Field(() => Date, { nullable: true })
    expected_payment_date: Date | null;

    @Field(() => Int, { nullable: true })
    order_sale_status_id?: number | null;

    @Field()
    order_code: number;

    @Field()
    invoice_code: number;

    @Field(() => Int, { nullable: true })
    receipt_type_id?: number | null;

    @Field(() => Int, { nullable: true })
    order_request_id?: number | null;

    @Field(() => Boolean, { nullable: false })
    require_supplement: boolean;

    @Field(() => String, { nullable: false })
    supplement_code: string;

    @Field(() => Boolean, { nullable: false })
    require_credit_note: boolean;

    @Field(() => String, { nullable: false })
    credit_note_code: string;

    @Field(() => Float, { nullable: false })
    credit_note_amount: number;

    @Field(() => String, { nullable: false })
    notes: string;

    @Field(() => Int, { nullable: true })
    account_id: number | null;

    @Field(() => Boolean, { nullable: false })
    canceled: boolean;
}

@InputType('OrderSaleInput')
export class OrderSaleInput extends OrderSaleBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [OrderSaleProductInput])
    order_sale_products: OrderSaleProductInput[];

    @Field({ nullable: false })
    receipt_type_id: number;

    @Field({ nullable: false })
    order_sale_status_id: number;
}

@ObjectType('OrderSale')
export class OrderSale extends OrderSaleBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Float, { nullable: false })
    transfer_receipts_total: number;

    @Field(() => Float, { nullable: false })
    tax: number;

    @Field(() => Float, { nullable: false })
    total_with_tax: number;

    @Field(() => Float, { nullable: false })
    subtotal: number;

    @Field(() => Float, { nullable: false })
    transfer_receipts_total_no_adjustments: number;
}

@ObjectType()
export class PaginatedOrderSales extends OffsetPaginatorResult(OrderSale) {}

@ArgsType()
export class PaginatedOrderSalesQueryArgs {
    @Field(() => String, { nullable: true })
    filter: string;

    @Field(() => Int, { nullable: true })
    account_id: number | null;

    @Field(() => Int, { nullable: true })
    receipt_type_id: number | null;

    @Field(() => Int, { nullable: true })
    order_sale_status_id: number | null;

    @Field(() => Boolean, { nullable: true })
    no_supplement: boolean;

    @Field(() => Boolean, { nullable: true })
    no_credit_note: boolean;

    @Field(() => Boolean, { nullable: true })
    is_transfer_incomplete: boolean;
}

@ArgsType()
export class GetOrderSalesQueryArgs {
    @Field(() => Int, { nullable: true })
    account_id: number | null;

    @Field(() => Int, { nullable: true })
    receipt_type_id: number | null;
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
