import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import {
    ActivityTypeName,
    Client,
    ClientContact,
    ClientUpsertInput,
    PaginatedClients,
    PaginatedClientsQueryArgs,
    PaginatedClientsSortArgs,
    User,
} from '../../../common/dto/entities';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { OffsetPaginatorArgs } from '../../../common/dto/pagination';

@Resolver(() => Client)
@UseGuards(GqlAuthGuard)
// @Role('super')
@Injectable()
export class ClientsResolver {
    constructor(
        private service: ClientsService,
        private pubSubService: PubSubService,
    ) {}

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

    @Query(() => PaginatedClients)
    async paginatedClients(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false })
        paginatedClientsQueryArgs: PaginatedClientsQueryArgs,
        @Args({ nullable: false })
        paginatedClientsSortArgs: PaginatedClientsSortArgs,
    ): Promise<PaginatedClients> {
        return this.service.paginatedClients({
            offsetPaginatorArgs,
            paginatedClientsQueryArgs,
            paginatedClientsSortArgs,
        });
    }

    @Mutation(() => Client)
    async upsertClient(
        @Args('ClientUpsertInput') input: ClientUpsertInput,
        @CurrentUser() currentUser: User,
    ): Promise<Client> {
        const client = await this.service.upsertClient(input);
        await this.pubSubService.client({
            client,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return client;
    }

    @Mutation(() => Boolean)
    async deleteClient(
        @Args('ClientId') clientId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const client = await this.getClient(clientId);
        if (!client) {
            throw new NotFoundException();
        }
        await this.service.deletesClient({ client_id: clientId });
        await this.pubSubService.client({
            client,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
        });
        return true;
    }

    @ResolveField(() => [ClientContact])
    async client_contacts(@Parent() client: Client) {
        return this.service.getClientContacts({
            client_id: client.id,
        });
    }

    @ResolveField(() => Boolean, { nullable: false })
    async is_deletable(@Parent() client: Client) {
        return this.service.isDeletable({ client_id: client.id });
    }

    @Subscription(() => Client)
    async client() {
        return this.pubSubService.listenForClient();
    }
}
