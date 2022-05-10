import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderRequestBase {
    @Field({ nullable: true })
    date: Date | null;
}

@InputType('OrderRequestInput')
export class OrderRequestInput extends OrderRequestBase {
    @Field({ nullable: true })
    id: number | null;
}

@ObjectType('OrderRequest')
export class OrderRequest extends OrderRequestBase {
    @Field({ nullable: false })
    id: number;
}
