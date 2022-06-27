import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ProductInventory } from '../../../common/dto/entities/production/product-inventory.dto';
import { ProductionSummaryService } from './production-summary.service';
import { ProductionSummaryArgs } from '../../../common/dto/entities/summaries/production-summary.dto';

@Resolver(() => ProductInventory)
// @Role('super')
@Injectable()
export class ProductionSummaryResolver {
    constructor(private service: ProductionSummaryService) {}

    @Query(() => Boolean, { nullable: false })
    async getProductionSummary(
        @Args('ProductionSummaryArgs')
        productionSummaryArgs: ProductionSummaryArgs,
    ): Promise<boolean> {
        console.log(productionSummaryArgs);

        return this.service.getProductionSummary();
    }
}
