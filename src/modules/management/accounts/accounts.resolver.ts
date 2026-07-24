import {
    Args,
    Float,
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
    Account,
    AccountContact,
    AccountProduct,
    AccountResource,
    AccountsQueryArgs,
    AccountTransactionItem,
    AccountTransferItem,
    AccountUpsertInput,
    SimilarAccountName,
    ActivityTypeName,
    PaginatedAccounts,
    PaginatedAccountsQueryArgs,
    PaginatedAccountsSortArgs,
    Resource,
    User,
    UserWithRoles,
} from '../../../common/dto/entities';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { isAccountClientRestricted } from '../../../common/helpers';
import { OffsetPaginatorArgs } from '../../../common/dto/pagination';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Resolver(() => Account)
@Injectable()
export class AccountsResolver {
    constructor(
        private service: AccountsService,
        private pubSubService: PubSubService,
        private auditUsersService: AuditUsersService,
    ) {}

    @Query(() => [Account])
    async getAccounts(
        @Args({ nullable: false })
        accountsQueryArgs: AccountsQueryArgs,
        @CurrentUser() currentUser: UserWithRoles,
    ): Promise<Account[]> {
        return this.service.getAccounts({
            accountsQueryArgs: accountsQueryArgs,
            clientRestricted: isAccountClientRestricted(currentUser),
        });
    }

    @Query(() => Account, { nullable: true })
    async getAccount(
        @Args('AccountId') accountId: number,
        @CurrentUser() currentUser: UserWithRoles,
    ): Promise<Account | null> {
        return this.service.getAccount({
            account_id: accountId,
            clientRestricted: isAccountClientRestricted(currentUser),
        });
    }

    @Query(() => [SimilarAccountName])
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
    async getSimilarAccountNames(
        @Args('Name') name: string,
        @Args('ExcludeAccountId', { nullable: true })
        excludeAccountId?: number,
    ): Promise<SimilarAccountName[]> {
        return this.service.getSimilarAccountNames({
            name,
            exclude_account_id: excludeAccountId,
        });
    }

    @Query(() => [AccountTransactionItem])
    async getAccountTransactionHistory(
        @Args('AccountId') accountId: number,
        @CurrentUser() currentUser: UserWithRoles,
        @Args('From', { nullable: true }) from?: string,
        @Args('Until', { nullable: true }) until?: string,
    ): Promise<AccountTransactionItem[]> {
        return this.service.getAccountTransactionHistory({
            account_id: accountId,
            from: from ?? null,
            until: until ?? null,
            clientRestricted: isAccountClientRestricted(currentUser),
        });
    }

    @Query(() => Float)
    async getAccountOpeningBalance(
        @Args('AccountId') accountId: number,
        @CurrentUser() currentUser: UserWithRoles,
        @Args('From', { nullable: true }) from?: string,
    ): Promise<number> {
        return this.service.getAccountOpeningBalance({
            account_id: accountId,
            from: from ?? null,
            clientRestricted: isAccountClientRestricted(currentUser),
        });
    }

    @Query(() => [AccountTransferItem])
    async getAccountTransfers(
        @Args('AccountId') accountId: number,
        @CurrentUser() currentUser: UserWithRoles,
        @Args('From', { nullable: true }) from?: string,
        @Args('Until', { nullable: true }) until?: string,
    ): Promise<AccountTransferItem[]> {
        return this.service.getAccountTransfers({
            account_id: accountId,
            from: from ?? null,
            until: until ?? null,
            clientRestricted: isAccountClientRestricted(currentUser),
        });
    }

    @Query(() => PaginatedAccounts)
    async paginatedAccounts(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false })
        paginatedAccountsQueryArgs: PaginatedAccountsQueryArgs,
        @Args({ nullable: false })
        paginatedAccountsSortArgs: PaginatedAccountsSortArgs,
        @CurrentUser() currentUser: UserWithRoles,
    ): Promise<PaginatedAccounts> {
        return this.service.paginatedAccounts({
            offsetPaginatorArgs,
            paginatedAccountsQueryArgs,
            paginatedAccountsSortArgs,
            clientRestricted: isAccountClientRestricted(currentUser),
        });
    }

    @Mutation(() => Account)
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
    async upsertAccount(
        @Args('AccountUpsertInput') input: AccountUpsertInput,
        @CurrentUser() currentUser: User,
    ): Promise<Account> {
        const account = await this.service.upsertAccount(input, {
            current_user_id: currentUser.id,
        });
        await this.pubSubService.account({
            account,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return account;
    }

    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
    async deleteAccount(
        @Args('AccountId') accountId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        // Admin-gated delete — read straight from the service (no client
        // restriction; this resolver's getAccount now requires a user).
        const account = await this.service.getAccount({
            account_id: accountId,
        });
        if (!account) {
            throw new NotFoundException();
        }
        await this.service.deletesAccount({
            account_id: accountId,
            current_user_id: currentUser.id,
        });
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

    @ResolveField(() => [AccountProduct])
    async account_products(@Parent() account: Account) {
        return this.service.getAccountProducts({
            account_id: account.id,
        });
    }

    @ResolveField(() => [AccountResource])
    async account_resources(@Parent() account: Account) {
        return this.service.getAccountResources({
            account_id: account.id,
        });
    }

    @ResolveField(() => Resource, { nullable: true })
    async resource(@Parent() account: Account): Promise<Resource | null> {
        return this.service.getResource({
            resource_id: account.resource_id,
        });
    }

    @ResolveField(() => Boolean, { nullable: false })
    async is_deletable(@Parent() account: Account) {
        return this.service.isDeletable({ account_id: account.id });
    }

    @ResolveField(() => [SimilarAccountName])
    async similar_name_matches(@Parent() account: Account) {
        return account.similar_name_matches || [];
    }

    @ResolveField(() => String, { nullable: false })
    async compound_name(@Parent() account: Account): Promise<string> {
        return account.abbreviation !== ''
            ? `${account.name} (${account.abbreviation})`
            : account.name;
    }

    @ResolveField(() => User, { nullable: true })
    async created_by(@Parent() account: Account): Promise<User | null> {
        return this.auditUsersService.getCreatedBy({
            created_by_id: account.created_by_id,
        });
    }

    @ResolveField(() => User, { nullable: true })
    async updated_by(@Parent() account: Account): Promise<User | null> {
        return this.auditUsersService.getUpdatedBy({
            updated_by_id: account.updated_by_id,
        });
    }

    @Subscription(() => Account)
    async account() {
        return this.pubSubService.listenForAccount();
    }
}
