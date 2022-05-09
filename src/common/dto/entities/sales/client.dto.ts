import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { ClientContactInput } from './client-contact.dto';

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

    @Field(() => [ClientContactInput])
    client_contacts: ClientContactInput[];
}

@ObjectType('Client')
export class Client extends ClientBase {
    @Field({ nullable: false })
    id: number;
}
