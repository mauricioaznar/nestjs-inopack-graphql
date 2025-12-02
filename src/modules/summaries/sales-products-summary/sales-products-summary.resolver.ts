import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { SalesProductsSummaryService } from './sales-products-summary.service';
import {
    SalesSummary,
    SalesSummaryArgs,
} from '../../../common/dto/entities/summaries/sales-summary.dto';

@Resolver(() => SalesSummary)
// @Role('super')
@Injectable()
export class SalesProductsSummaryResolver {
    constructor(private service: SalesProductsSummaryService) {}

    @Query(() => SalesSummary, { nullable: false })
    async getSalesProductsSummary(
        @Args('SalesSummaryArgs')
        salesSummaryArgs: SalesSummaryArgs,
    ): Promise<SalesSummary> {
        return this.service.getSalesProductsSummary(salesSummaryArgs);
    }
}
