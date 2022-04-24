import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { PartCategoriesService } from './part-categories.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import {
    PartCategory,
    PartCategoryUpsertInput,
} from '../../../common/dto/entities/part-category.dto';
import { Part } from '../../../common/dto/entities/part.dto';

@Resolver(() => PartCategory)
@UseGuards(GqlAuthGuard)
@Injectable()
export class PartCategoriesResolver {
    constructor(private partCategoriesService: PartCategoriesService) {}

    @Mutation(() => PartCategory)
    async upsertPartCategory(
        @Args('PartCategoryUpsertInput') input: PartCategoryUpsertInput,
    ): Promise<PartCategory> {
        return this.partCategoriesService.upsertPartCategory(input);
    }

    @Query(() => [PartCategory])
    async getPartCategories(): Promise<PartCategory[]> {
        return this.partCategoriesService.getPartCategories();
    }

    @Query(() => PartCategory)
    async getPartCategory(
        @Args('PartCategoryId') id: number,
    ): Promise<PartCategory> {
        return this.partCategoriesService.getPartCategory({
            part_category_id: id,
        });
    }

    @ResolveField(() => [Part])
    async parts(partCategory: PartCategory): Promise<Part[]> {
        return this.partCategoriesService.getParts(partCategory);
    }
}
