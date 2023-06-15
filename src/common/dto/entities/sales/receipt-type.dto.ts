import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderSaleReceiptTypeBase {
    @Field()
    name: string;
}

@ObjectType('ReceiptType')
export class ReceiptType extends OrderSaleReceiptTypeBase {
    @Field({ nullable: false })
    id: number;
}
