import { Args, ArgsType, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { PartTransactionsService } from './part-transactions.service';
import { Part } from '../../../common/dto/entities/part.dto';
import { PartTransaction } from '../../../common/dto/entities/part-transactions.dto';
import { PartOperation } from '../../../common/dto/entities/part-operation.dto';
import { DatePaginatorArgs } from '../../../common/dto/pagination/date-paginator/date-paginator-args';

@Resolver(() => PartTransaction)
@Injectable()
export class PartTransactionsResolver {
    constructor(private partTransactionsService: PartTransactionsService) {}

    @Query(() => [PartTransaction])
    async getPartTransactions(
        @Args() datePaginator: DatePaginatorArgs,
    ): Promise<PartTransaction[]> {
        return this.partTransactionsService.getPartTransactions(datePaginator);
    }

    @ResolveField(() => Part, { nullable: true })
    async part(partTransaction: PartTransaction): Promise<Part | null> {
        return this.partTransactionsService.getPart({
            part_id: partTransaction.part_id,
        });
    }

    @ResolveField(() => PartOperation, { nullable: true })
    async part_operation(
        partTransaction: PartTransaction,
    ): Promise<PartOperation | null> {
        return this.partTransactionsService.getPartOperation({
            part_operation_id: partTransaction.part_operation_id,
        });
    }
}
