import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { PartCategoriesService } from './part-categories.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import {
    PartCategory,
    PartCategoryInput,
} from '../../../common/dto/entities/part-category.dto';
import { Part } from '../../../common/dto/entities/part.dto';

@Resolver(() => PartCategory)
@UseGuards(GqlAuthGuard)
@Injectable()
export class PartCategoriesResolver {
    constructor(private partCategoriesService: PartCategoriesService) {}

    @Mutation(() => PartCategory)
    async addCategory(@Args('partCategoryInput') input: PartCategoryInput) {
        return this.partCategoriesService.addCategory(input);
    }

    @Query(() => [PartCategory])
    async getPartCategories() {
        return this.partCategoriesService.getPartCategories();
    }

    @ResolveField(() => [Part])
    async parts(partCategory: PartCategory) {
        return this.partCategoriesService.getParts(partCategory);
    }
}
