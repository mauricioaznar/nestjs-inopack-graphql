import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderSaleStatusBase {
    @Field()
    name: string;
}

@ObjectType('OrderSaleStatus')
export class OrderSaleStatus extends OrderSaleStatusBase {
    @Field({ nullable: false })
    id: number;
}
