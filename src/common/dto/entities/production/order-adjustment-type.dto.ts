import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderAdjustmentTypeBase {
    @Field()
    name: string;
}

@ObjectType('OrderAdjustmentType')
export class OrderAdjustmentType extends OrderAdjustmentTypeBase {
    @Field({ nullable: false })
    id: number;
}
