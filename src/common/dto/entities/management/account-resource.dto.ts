import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class AccountResourceBase {
    @Field(() => Float, { nullable: false })
    unit_price: number;

    @Field({ nullable: false })
    notes: string;

    @Field(() => Int, { nullable: true })
    resource_id?: number | null;
}

@InputType('AccountResourceInput')
export class AccountResourceInput extends AccountResourceBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('AccountResource')
export class AccountResource extends AccountResourceBase {
    @Field(() => Int, { nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    account_id?: number | null;
}
