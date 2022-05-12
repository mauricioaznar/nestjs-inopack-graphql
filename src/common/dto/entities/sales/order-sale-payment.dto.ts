import { Field, InputType, ObjectType } from '@nestjs/graphql';
@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderSalePaymentBase {
    @Field()
    date_paid: Date;

    @Field()
    amount: number;

    @Field()
    order_sale_collection_status_id: number;
}

@InputType('OrderSalePaymentInput')
export class OrderSalePaymentInput extends OrderSalePaymentBase {
    @Field({ nullable: true })
    id: number | null;
}

@ObjectType('OrderSalePayment')
export class OrderSalePayment extends OrderSalePaymentBase {
    @Field({ nullable: false })
    id: number;

    @Field({ nullable: false })
    order_sale_id: number;
}
