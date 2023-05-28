import { Query, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { AccountTransferSummariesService } from './account-transfer-summaries.service';
import { Account } from '../../../common/dto/entities';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { AccountTransferSummary } from '../../../common/dto/entities/management/account-transfer-summary.dto';

@Resolver(() => Account)
@UseGuards(GqlAuthGuard)
// @Role('super')
@Injectable()
export class AccountTransferSummariesResolver {
    constructor(private service: AccountTransferSummariesService) {}

    @Query(() => [Account])
    async getAccountTransferSummary(): Promise<AccountTransferSummary[]> {
        return this.service.getAccountTransferSummary();
    }
}
