import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';

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

    @Field(() => Boolean, { nullable: false })
    include_in_accountability_export: boolean;

    @Field(() => Float, { nullable: false })
    tax_rate: number;
}
