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
import { AccountsService } from './accounts.service';
import {
    ActivityTypeName,
    Account,
    AccountContact,
    AccountUpsertInput,
    PaginatedAccounts,
    PaginatedAccountsQueryArgs,
    PaginatedAccountsSortArgs,
    User,
} from '../../../common/dto/entities';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { OffsetPaginatorArgs } from '../../../common/dto/pagination';

@Resolver(() => Account)
@UseGuards(GqlAuthGuard)
// @Role('super')
@Injectable()
export class AccountsResolver {
    constructor(
        private service: AccountsService,
        private pubSubService: PubSubService,
    ) {}

    @Query(() => [Account])
    async getAccounts(): Promise<Account[]> {
        return this.service.getAccounts();
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

    @ResolveField(() => Boolean, { nullable: false })
    async is_deletable(@Parent() account: Account) {
        return this.service.isDeletable({ account_id: account.id });
    }

    @Subscription(() => Account)
    async account() {
        return this.pubSubService.listenForAccount();
    }
}
