import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import {
    TransfersQueryArgs,
    TransfersSortArgs,
    PaginatedTransfers,
    Transfer,
    TransferUpsertInput,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';

@Resolver(() => Transfer)
@Injectable()
export class TransfersResolver {
    constructor(private service: TransfersService) {}

    @Mutation(() => Transfer)
    async upsertTransfer(
        @Args('TransferUpsertInput') input: TransferUpsertInput,
    ) {
        return this.service.upsertTransfer(input);
    }

    @Query(() => Transfer, {
        nullable: true,
    })
    async getTransfer(
        @Args('TransferId') id: number,
    ): Promise<Transfer | null> {
        return this.service.getTransfer({ transfer_id: id });
    }

    @Query(() => [Transfer])
    async getTransfers(): Promise<Transfer[]> {
        return this.service.getTransfers();
    }

    @Query(() => PaginatedTransfers)
    async paginatedTransfers(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
        @Args({ nullable: false })
        transfersQueryArgs: TransfersQueryArgs,
        @Args({ nullable: false })
        transfersSortArgs: TransfersSortArgs,
    ): Promise<PaginatedTransfers> {
        return this.service.paginatedTransfers({
            offsetPaginatorArgs,
            datePaginator,
            transfersQueryArgs,
            transfersSortArgs,
        });
    }
}
