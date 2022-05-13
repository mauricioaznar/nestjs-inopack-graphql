import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { OrderSaleProductInput } from './order-sale-product.dto';
import { OrderSalePaymentInput } from './order-sale-payment.dto';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderSaleBase {
    @Field()
    date: Date;

    @Field()
    order_sale_status_id: number;

    @Field()
    order_code: number;

    @Field()
    order_sale_receipt_type_id: number;

    @Field()
    order_request_id: number;
}

@InputType('OrderSaleInput')
export class OrderSaleInput extends OrderSaleBase {
    @Field({ nullable: true })
    id: number | null;

    @Field(() => [OrderSaleProductInput])
    order_sale_products: OrderSaleProductInput[];

    @Field(() => [OrderSalePaymentInput])
    order_sale_payments: OrderSalePaymentInput[];
}

@ObjectType('OrderSale')
export class OrderSale extends OrderSaleBase {
    @Field({ nullable: false })
    id: number;
}
