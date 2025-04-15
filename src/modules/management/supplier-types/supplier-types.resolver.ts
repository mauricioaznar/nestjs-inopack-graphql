import { Query, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { SupplierTypesService } from './supplier-types.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { ResourceCategory } from '../../../common/dto/entities';
import { SupplierType } from '../../../common/dto/entities/management/supplier-type.dto';

@Resolver(() => ResourceCategory)
@UseGuards(GqlAuthGuard)
@Injectable()
export class SupplierTypesResolver {
    constructor(private resourceCategoriesService: SupplierTypesService) {}

    @Query(() => [SupplierType])
    async getSupplierTypes(): Promise<SupplierType[]> {
        return this.resourceCategoriesService.getSupplierTypes();
    }
}
