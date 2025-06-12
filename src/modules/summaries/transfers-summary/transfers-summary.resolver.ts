import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { TransfersSummaryService } from './transfers-summary.service';
import {
    TransfersSummary,
    TransfersSummaryArgs,
} from '../../../common/dto/entities/summaries/transfers-summary.dto';

@Resolver(() => TransfersSummary)
// @Role('super')
@Injectable()
export class TransfersSummaryResolver {
    constructor(private service: TransfersSummaryService) {}

    @Query(() => TransfersSummary, { nullable: false })
    async getTransfersSummary(
        @Args('TransfersSummaryArgs')
        transfersSummaryArgs: TransfersSummaryArgs,
    ): Promise<TransfersSummary> {
        return this.service.getTransfersSummary(transfersSummaryArgs);
    }
}
