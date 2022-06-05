import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ClientContactBase {
    @Field()
    first_name: string;

    @Field()
    last_name: string;

    @Field({ nullable: true })
    email: string | null;

    @Field({ nullable: true })
    cellphone: string | null;
}

@InputType('ClientContactInput')
export class ClientContactInput extends ClientContactBase {
    @Field({ nullable: true })
    id?: number | null;
}

@ObjectType('ClientContact')
export class ClientContact extends ClientContactBase {
    @Field({ nullable: false })
    id: number;

    @Field()
    fullname: string;
}
