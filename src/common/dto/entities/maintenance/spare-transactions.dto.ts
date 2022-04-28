import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class SpareTransactionBase {
    @Field({ nullable: false })
    spare_id: number;

    @Field({ nullable: false })
    quantity: number;

    @Field({ nullable: true })
    spare_operation_id?: number | null;
}

@InputType('SpareTransactionInput')
export class SpareTransactionInput extends SpareTransactionBase {}

@ObjectType('SpareTransaction')
export class SpareTransaction extends SpareTransactionBase {
    @Field({ nullable: false })
    id: number;
}
