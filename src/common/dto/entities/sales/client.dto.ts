import {
    ArgsType,
    Field,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { ClientContactInput } from './client-contact.dto';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';
import { ColumnOrder } from '../../pagination';
import { ProductBase } from '../production/product.dto';

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
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [ClientContactInput])
    client_contacts: ClientContactInput[];
}

@ObjectType('Client')
export class Client extends ClientBase {
    @Field({ nullable: false })
    id: number;
}

@ObjectType()
export class PaginatedClients extends OffsetPaginatorResult(Client) {}

@ArgsType()
export class PaginatedClientsQueryArgs {
    @Field(() => String, { nullable: false })
    filter: string;
}

export enum ClientsSortableFields {
    name = 'name',
    abbreviation = 'abbreviation',
}

registerEnumType(ClientsSortableFields, {
    name: 'ClientsSortableFields',
});

@ArgsType()
export class PaginatedClientsSortArgs {
    @Field(() => ColumnOrder, { nullable: true })
    sort_order: ColumnOrder | null;

    @Field(() => ClientsSortableFields, { nullable: true })
    sort_field: ClientsSortableFields | null;
}
