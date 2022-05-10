import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderRequestStatusBase {
    @Field()
    name: string;
}

@ObjectType('OrderRequestStatus')
export class OrderRequestStatus extends OrderRequestStatusBase {
    @Field({ nullable: false })
    id: number;
}
