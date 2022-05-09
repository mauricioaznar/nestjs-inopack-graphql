import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ClientBase {
    @Field()
    name: string;

    @Field()
    abbreviation: string;
}

@InputType('ClientUpsertInput')
export class ClientUpsertInput extends ClientBase {
    @Field({ nullable: true })
    id?: number | null;
}

@ObjectType('Client')
export class Client extends ClientBase {
    @Field({ nullable: false })
    id: number;
}
