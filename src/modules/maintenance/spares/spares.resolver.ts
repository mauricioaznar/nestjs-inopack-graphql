import {
    Args,
    Float,
    Mutation,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { SparesService } from './spares.service';
import {
    Spare,
    SpareCategory,
    SpareTransaction,
    SpareUpsertInput,
} from '../../../common/dto/entities';
import { SpareInventoryService } from '../../../common/services/entities/spare-inventory.service';

@Resolver(() => Spare)
@Injectable()
export class SparesResolver {
    constructor(
        private sparesService: SparesService,
        private spareInventoryService: SpareInventoryService,
    ) {}

    @Query(() => [Spare])
    async getSpares() {
        return this.sparesService.getSpares();
    }

    @Query(() => Spare)
    async getSpare(@Args('SpareId') spareId: number): Promise<Spare | null> {
        return this.sparesService.getSpare({ spare_id: spareId });
    }

    @Mutation(() => Spare)
    async upsertSpare(
        @Args('SpareUpsertInput') input: SpareUpsertInput,
    ): Promise<Spare> {
        return this.sparesService.upsertSpare(input);
    }

    @Mutation(() => Boolean)
    async deleteSpare(@Args('SpareId') id: number): Promise<boolean> {
        return this.sparesService.deleteSpare({ spare_id: id });
    }

    @ResolveField(() => Float)
    async current_quantity(spare: Spare) {
        return this.spareInventoryService.getCurrentQuantity(spare.id);
    }

    @ResolveField(() => SpareCategory, { nullable: true })
    async spare_category(spare: Spare) {
        return this.sparesService.getSpareCategory({
            spare_category_id: spare.spare_category_id,
        });
    }

    @ResolveField(() => Float)
    async total_required_quantity(spare: Spare) {
        return this.sparesService.getTotalRequiredQuantity({
            spare_id: spare.id,
        });
    }

    @ResolveField(() => [SpareTransaction])
    async spare_transactions(spare: Spare) {
        return this.sparesService.getSpareTransactions({ spare_id: spare.id });
    }

    @ResolveField(() => Boolean)
    async is_deletable(spare: Spare) {
        return this.sparesService.isDeletable({ spare_id: spare.id });
    }
}
