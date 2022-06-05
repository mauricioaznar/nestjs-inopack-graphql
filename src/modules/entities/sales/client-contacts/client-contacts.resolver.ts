import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ClientContactsService } from './client-contacts.service';
import { ClientContact } from '../../../../common/dto/entities';

@Resolver(() => ClientContact)
// @Role('super')
@Injectable()
export class ClientContactsResolver {
    constructor(private service: ClientContactsService) {}

    @Query(() => [ClientContact])
    async getClientContacts(): Promise<ClientContact[]> {
        return this.service.getClientContacts();
    }
}
