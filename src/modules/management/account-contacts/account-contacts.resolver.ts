import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { AccountContactsService } from './account-contacts.service';
import { AccountContact } from '../../../common/dto/entities';

@Resolver(() => AccountContact)
// @Role('super')
@Injectable()
export class AccountContactsResolver {
    constructor(private service: AccountContactsService) {}

    @Query(() => [AccountContact])
    async getAccountContacts(): Promise<AccountContact[]> {
        return this.service.getAccountContacts();
    }
}
