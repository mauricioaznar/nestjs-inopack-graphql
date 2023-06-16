import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import {
    Account,
    AccountContact,
    AccountsQueryArgs,
    AccountType,
    AccountUpsertInput,
    ActivityTypeName,
    PaginatedAccounts,
    PaginatedAccountsQueryArgs,
    PaginatedAccountsSortArgs,
    Product,
    User,
} from '../../../common/dto/entities';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { OffsetPaginatorArgs } from '../../../common/dto/pagination';

@Resolver(() => Account)
@Injectable()
export class AccountsResolver {
    constructor(
        private service: AccountsService,
        private pubSubService: PubSubService,
    ) {}

    @Query(() => [Account])
    async getAccounts(
        @Args({ nullable: false })
        accountsQueryArgs: AccountsQueryArgs,
    ): Promise<Account[]> {
        return this.service.getAccounts({
            accountsQueryArgs: accountsQueryArgs,
        });
    }

    @Query(() => Account, { nullable: true })
    async getAccount(
        @Args('AccountId') accountId: number,
    ): Promise<Account | null> {
        return this.service.getAccount({
            account_id: accountId,
        });
    }

    @Query(() => PaginatedAccounts)
    async paginatedAccounts(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false })
        paginatedAccountsQueryArgs: PaginatedAccountsQueryArgs,
        @Args({ nullable: false })
        paginatedAccountsSortArgs: PaginatedAccountsSortArgs,
    ): Promise<PaginatedAccounts> {
        return this.service.paginatedAccounts({
            offsetPaginatorArgs,
            paginatedAccountsQueryArgs,
            paginatedAccountsSortArgs,
        });
    }

    @Mutation(() => Account)
    async upsertAccount(
        @Args('AccountUpsertInput') input: AccountUpsertInput,
        @CurrentUser() currentUser: User,
    ): Promise<Account> {
        const account = await this.service.upsertAccount(input);
        await this.pubSubService.account({
            account,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return account;
    }

    @Mutation(() => Boolean)
    async deleteAccount(
        @Args('AccountId') accountId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const account = await this.getAccount(accountId);
        if (!account) {
            throw new NotFoundException();
        }
        await this.service.deletesAccount({ account_id: accountId });
        await this.pubSubService.account({
            account,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
        });
        return true;
    }

    @ResolveField(() => [AccountContact])
    async account_contacts(@Parent() account: Account) {
        return this.service.getAccountContacts({
            account_id: account.id,
        });
    }

    @ResolveField(() => AccountType, { nullable: true })
    async account_type(@Parent() account: Account) {
        return this.service.getAccountType({
            account_type_id: account.account_type_id,
        });
    }

    @ResolveField(() => Boolean, { nullable: false })
    async is_deletable(@Parent() account: Account) {
        return this.service.isDeletable({ account_id: account.id });
    }

    @ResolveField(() => String, { nullable: false })
    async compound_name(@Parent() account: Account): Promise<string> {
        return account.abbreviation !== ''
            ? `${account.name} (${account.abbreviation})`
            : account.name;
    }

    @Subscription(() => Account)
    async account() {
        return this.pubSubService.listenForAccount();
    }
}
