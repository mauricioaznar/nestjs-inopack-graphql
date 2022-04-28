import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderProductionTypeBase {
    @Field()
    name: string;
}

@ObjectType('OrderProductionType')
export class OrderProductionType extends OrderProductionTypeBase {
    @Field({ nullable: false })
    id: number;
}
