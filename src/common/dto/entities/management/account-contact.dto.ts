import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class AccountContactBase {
    @Field()
    first_name: string;

    @Field()
    last_name: string;

    @Field({ nullable: false })
    email: string;

    @Field({ nullable: false })
    cellphone: string;
}

@InputType('AccountContactInput')
export class AccountContactInput extends AccountContactBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('AccountContact')
export class AccountContact extends AccountContactBase {
    @Field({ nullable: false })
    id: number;

    @Field()
    fullname: string;
}
