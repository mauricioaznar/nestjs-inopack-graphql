import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { ThirdPartyAccountTransferSummariesService } from './third-party-account-transfer-summaries.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { Account } from '../../../common/dto/entities';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';
import { ThirdPartyAccountTransferSummary } from '../../../common/dto/entities/summaries/third-party-account-transfer-summary.dto';

@Resolver(() => ThirdPartyAccountTransferSummary)
@UseGuards(GqlAuthGuard)
// @Role('super')
@Injectable()
export class ThirdPartyAccountTransferSummariesResolver {
    constructor(private service: ThirdPartyAccountTransferSummariesService) {}

    @Query(() => [ThirdPartyAccountTransferSummary])
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
    async getThirdPartyAccountsTransferSummary(): Promise<
        ThirdPartyAccountTransferSummary[]
    > {
        return this.service.getThirdPartyAccountTransferSummary();
    }

    @ResolveField(() => Account, { nullable: true })
    async account(
        @Parent()
        thirdPartyAccountTransferSummary: ThirdPartyAccountTransferSummary,
    ) {
        return this.service.getAccount({
            account_id: thirdPartyAccountTransferSummary.account_id,
        });
    }
}
