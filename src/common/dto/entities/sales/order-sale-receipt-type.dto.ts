import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderSaleReceiptTypeBase {
    @Field()
    name: string;
}

@ObjectType('OrderSaleReceiptType')
export class OrderSaleReceiptType extends OrderSaleReceiptTypeBase {
    @Field({ nullable: false })
    id: number;
}
