import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { AccountTransferSummariesService } from './account-transfer-summaries.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { AccountTransferSummary } from '../../../common/dto/entities/management/account-transfer-summary.dto';
import { Account } from '../../../common/dto/entities';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';

@Resolver(() => AccountTransferSummary)
@UseGuards(GqlAuthGuard)
// @Role('super')
@Injectable()
export class AccountTransferSummariesResolver {
    constructor(private service: AccountTransferSummariesService) {}

    @Query(() => [AccountTransferSummary])
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
    async getAccountTransferSummary(): Promise<AccountTransferSummary[]> {
        return this.service.getAccountTransferSummary();
    }

    @ResolveField(() => Account, { nullable: true })
    async account(@Parent() accountTransferSummary: AccountTransferSummary) {
        return this.service.getAccount({
            account_id: accountTransferSummary.account_id,
        });
    }
}
