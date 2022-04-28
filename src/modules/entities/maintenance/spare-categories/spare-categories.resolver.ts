import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { SpareCategoriesService } from './spare-categories.service';
import { GqlAuthGuard } from '../../../auth/guards/gql-auth.guard';
import {
    Spare,
    SpareCategory,
    SpareCategoryUpsertInput,
} from '../../../../common/dto/entities';

@Resolver(() => SpareCategory)
@UseGuards(GqlAuthGuard)
@Injectable()
export class SpareCategoriesResolver {
    constructor(private spareCategoriesService: SpareCategoriesService) {}

    @Query(() => [SpareCategory])
    async getSpareCategories(): Promise<SpareCategory[]> {
        return this.spareCategoriesService.getSpareCategories();
    }

    @Query(() => SpareCategory)
    async getSpareCategory(
        @Args('SpareCategoryId') id: number,
    ): Promise<SpareCategory> {
        return this.spareCategoriesService.getSpareCategory({
            spare_category_id: id,
        });
    }

    @Mutation(() => Boolean)
    async deleteSpareCategory(
        @Args('SpareCategoryId') id: number,
    ): Promise<boolean> {
        return this.spareCategoriesService.deleteSpareCategory({
            spare_category_id: id,
        });
    }

    @Mutation(() => SpareCategory)
    async upsertSpareCategory(
        @Args('SpareCategoryUpsertInput') input: SpareCategoryUpsertInput,
    ): Promise<SpareCategory> {
        return this.spareCategoriesService.upsertSpareCategory(input);
    }

    @ResolveField(() => [Spare])
    async spares(spareCategory: SpareCategory): Promise<Spare[]> {
        return this.spareCategoriesService.getSpares(spareCategory);
    }

    @ResolveField(() => Boolean)
    async is_deletable(spareCategory: SpareCategory): Promise<boolean> {
        return this.spareCategoriesService.isDeletable({
            spare_category_id: spareCategory.id,
        });
    }
}
