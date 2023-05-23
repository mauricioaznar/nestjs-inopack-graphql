import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class AccountTypeBase {
    @Field({ nullable: false })
    name: string;
}

@ObjectType('AccountType')
export class AccountType extends AccountTypeBase {
    @Field({ nullable: false })
    id: number;
}
