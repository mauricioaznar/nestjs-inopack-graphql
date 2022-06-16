import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ProductTypesService } from './product-types.service';
import { ProductType } from '../../../common/dto/entities/production/product-type.dto';

@Resolver(() => ProductType)
// @Role('super')
@Injectable()
export class ProductTypesResolver {
    constructor(private productTypesService: ProductTypesService) {}

    @Query(() => [ProductType])
    async getProductTypes(): Promise<ProductType[]> {
        return this.productTypesService.getProductTypes();
    }
}
