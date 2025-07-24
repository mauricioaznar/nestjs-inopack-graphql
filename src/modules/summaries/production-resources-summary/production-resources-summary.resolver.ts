import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ProductionResourcesSummaryService } from './production-resources-summary.service';
import {
    ProductionResourcesArgs,
    ProductionResourcesSummary,
} from '../../../common/dto/entities';

@Resolver(() => ProductionResourcesSummary)
// @Role('super')
@Injectable()
export class ProductionResourcesSummaryResolver {
    constructor(private service: ProductionResourcesSummaryService) {}

    @Query(() => ProductionResourcesSummary, { nullable: false })
    async getProductionResourcesSummary(
        @Args('ProductionResourcesArgs')
        productionResourcesArgs: ProductionResourcesArgs,
    ): Promise<ProductionResourcesSummary> {
        return this.service.getProductionResourcesSummary(
            productionResourcesArgs,
        );
    }
}
