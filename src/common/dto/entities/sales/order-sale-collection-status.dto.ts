import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderSaleCollectionStatusBase {
    @Field()
    name: string;
}

@ObjectType('OrderSaleCollectionStatus')
export class OrderSaleCollectionStatus extends OrderSaleCollectionStatusBase {
    @Field({ nullable: false })
    id: number;
}
