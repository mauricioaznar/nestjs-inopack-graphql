import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Client, ClientUpsertInput } from '../../../../common/dto/entities';

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
            clientId: clientId,
        });
    }

    @Mutation(() => Client)
    async upsertClient(
        @Args('ClientUpsertInput') input: ClientUpsertInput,
    ): Promise<Client> {
        return this.service.upsertClient(input);
    }
}
