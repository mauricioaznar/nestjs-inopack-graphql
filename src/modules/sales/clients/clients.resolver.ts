import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import {
    Client,
    ClientContact,
    ClientUpsertInput,
    User,
} from '../../../common/dto/entities';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

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

    @Mutation(() => Client)
    async upsertClient(
        @Args('ClientUpsertInput') input: ClientUpsertInput,
        @CurrentUser() currentUser: User,
    ): Promise<Client> {
        const client = await this.service.upsertClient(input);
        await this.pubSubService.publishClient({
            client,
            create: !input.id,
            userId: currentUser.id,
        });
        return client;
    }

    @ResolveField(() => [ClientContact])
    async client_contacts(@Parent() client: Client) {
        return this.service.getClientContacts({
            client_id: client.id,
        });
    }

    @Subscription(() => Client)
    async client() {
        return this.pubSubService.listenForClient();
    }
}
