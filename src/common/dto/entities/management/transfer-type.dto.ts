import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class TransferTypeBase {
    @Field({ nullable: false })
    name: string;
}

@ObjectType('TransferType')
export class TransferType extends TransferTypeBase {
    @Field({ nullable: false })
    id: number;
}
