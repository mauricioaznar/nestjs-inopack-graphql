import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class SpareTransactionBase {
    @Field(() => Int, { nullable: true })
    spare_id: number | null;

    @Field({ nullable: false })
    quantity: number;

    @Field(() => Int, { nullable: true })
    spare_operation_id?: number | null;
}

@InputType('SpareTransactionInput')
export class SpareTransactionInput extends SpareTransactionBase {}

@ObjectType('SpareTransaction')
export class SpareTransaction extends SpareTransactionBase {
    @Field({ nullable: false })
    id: number;
}
