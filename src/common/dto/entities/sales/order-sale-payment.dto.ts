import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
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

@ObjectType('OrderSalePayment')
export class OrderSalePayment extends OrderSalePaymentBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    order_sale_id?: number | null;
}
