import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { SpareTransactionsService } from './spare-transactions.service';
import {
    Spare,
    SpareOperation,
    SpareTransaction,
} from '../../../common/dto/entities';
import { YearMonth } from '../../../common/dto/pagination';

@Resolver(() => SpareTransaction)
@Injectable()
export class SpareTransactionsResolver {
    constructor(private spareTransactionsService: SpareTransactionsService) {}

    @Query(() => [SpareTransaction])
    async getSpareTransactions(
        @Args() datePaginator: YearMonth,
    ): Promise<SpareTransaction[]> {
        return this.spareTransactionsService.getSpareTransactions(
            datePaginator,
        );
    }

    @ResolveField(() => Spare, { nullable: true })
    async spare(spareTransaction: SpareTransaction): Promise<Spare | null> {
        return this.spareTransactionsService.getSpare({
            spare_id: spareTransaction.spare_id,
        });
    }

    @ResolveField(() => SpareOperation, { nullable: true })
    async spare_operation(
        spareTransaction: SpareTransaction,
    ): Promise<SpareOperation | null> {
        return this.spareTransactionsService.getSpareOperation({
            spare_operation_id: spareTransaction.spare_operation_id,
        });
    }
}
