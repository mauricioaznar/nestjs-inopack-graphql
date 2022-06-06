import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ClientContactBase {
    @Field()
    first_name: string;

    @Field()
    last_name: string;

    @Field({ nullable: false })
    email: string;

    @Field({ nullable: false })
    cellphone: string;
}

@InputType('ClientContactInput')
export class ClientContactInput extends ClientContactBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('ClientContact')
export class ClientContact extends ClientContactBase {
    @Field({ nullable: false })
    id: number;

    @Field()
    fullname: string;
}
