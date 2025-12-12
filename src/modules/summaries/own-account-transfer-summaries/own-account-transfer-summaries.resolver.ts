import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { OwnAccountTransferSummariesService } from './own-account-transfer-summaries.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { OwnAccountTransferSummary } from '../../../common/dto/entities/summaries/own-account-transfer-summary.dto';
import { Account } from '../../../common/dto/entities';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';

@Resolver(() => OwnAccountTransferSummary)
@UseGuards(GqlAuthGuard)
// @Role('super')
@Injectable()
export class OwnAccountTransferSummariesResolver {
    constructor(private service: OwnAccountTransferSummariesService) {}

    @Query(() => [OwnAccountTransferSummary])
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
    async getOwnAccountsTransferSummary(): Promise<
        OwnAccountTransferSummary[]
    > {
        return this.service.getOwnAccountsTransferSummary();
    }

    @ResolveField(() => Account, { nullable: true })
    async account(@Parent() accountTransferSummary: OwnAccountTransferSummary) {
        return this.service.getAccount({
            account_id: accountTransferSummary.account_id,
        });
    }
}
