import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ProductionSummaryService } from './production-summary.service';
import {
    ProductionSummary,
    ProductionSummaryArgs,
} from '../../../common/dto/entities/summaries/production-summary.dto';

@Resolver(() => ProductionSummary)
// @Role('super')
@Injectable()
export class ProductionSummaryResolver {
    constructor(private service: ProductionSummaryService) {}

    @Query(() => ProductionSummary, { nullable: false })
    async getProductionSummary(
        @Args('ProductionSummaryArgs')
        productionSummaryArgs: ProductionSummaryArgs,
    ): Promise<ProductionSummary> {
        return this.service.getProductionSummary(productionSummaryArgs);
    }
}
