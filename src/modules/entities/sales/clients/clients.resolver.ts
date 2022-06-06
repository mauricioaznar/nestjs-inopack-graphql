import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ClientsService } from './clients.service';
import {
    Client,
    ClientContact,
    ClientUpsertInput,
} from '../../../../common/dto/entities';

@Resolver(() => Client)
// @Role('super')
@Injectable()
export class ClientsResolver {
    constructor(private service: ClientsService) {}

    @Query(() => [Client])
    async getClients(): Promise<Client[]> {
        return this.service.getClients();
    }

    @Query(() => Client, { nullable: true })
    async getClient(
        @Args('ClientId') clientId: number,
    ): Promise<Client | null> {
        return this.service.getClient({
            client_id: clientId,
        });
    }

    @Mutation(() => Client)
    async upsertClient(
        @Args('ClientUpsertInput') input: ClientUpsertInput,
    ): Promise<Client> {
        return this.service.upsertClient(input);
    }

    @ResolveField(() => [ClientContact])
    async client_contacts(@Parent() client: Client) {
        return this.service.getClientContacts({
            client_id: client.id,
        });
    }
}
