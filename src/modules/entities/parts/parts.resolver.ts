import {
    Args,
    Float,
    Mutation,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { PartsService } from './parts.service';
import {
    Part,
    PartCategory,
    PartTransaction,
    PartUpsertInput,
} from '../../../common/dto/entities';
import { PartInventoryService } from '../../../common/services/entities/part-inventory.service';

@Resolver(() => Part)
@Injectable()
export class PartsResolver {
    constructor(
        private partsService: PartsService,
        private partInventoryService: PartInventoryService,
    ) {}

    @Query(() => [Part])
    async getParts() {
        return this.partsService.getParts();
    }

    @Query(() => Part)
    async getPart(@Args('PartId') partId: number): Promise<Part | null> {
        return this.partsService.getPart({ part_id: partId });
    }

    @Mutation(() => Part)
    async upsertPart(
        @Args('PartUpsertInput') input: PartUpsertInput,
    ): Promise<Part> {
        return this.partsService.upsertPart(input);
    }

    @Mutation(() => Boolean)
    async deletePart(@Args('PartId') id: number): Promise<boolean> {
        return this.partsService.deletePart({ part_id: id });
    }

    @ResolveField(() => Float)
    async current_quantity(part: Part) {
        return this.partInventoryService.getCurrentQuantity(part.id);
    }

    @ResolveField(() => PartCategory, { nullable: true })
    async part_category(part: Part) {
        return this.partsService.getPartCategory({
            part_category_id: part.part_category_id,
        });
    }

    @ResolveField(() => Float)
    async total_required_quantity(part: Part) {
        return this.partsService.getTotalRequiredQuantity({
            part_id: part.id,
        });
    }

    @ResolveField(() => [PartTransaction])
    async part_transactions(part: Part) {
        return this.partsService.getPartTransactions({ part_id: part.id });
    }

    @ResolveField(() => Boolean)
    async is_deletable(part: Part) {
        return this.partsService.isDeletable({ part_id: part.id });
    }
}
