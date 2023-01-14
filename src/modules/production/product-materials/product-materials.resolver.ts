import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ProductMaterialsService } from './product-materials.service';
import { ProductMaterial } from '../../../common/dto/entities/production/product-material.dto';

@Resolver(() => ProductMaterial)
// @Role('super')
@Injectable()
export class ProductMaterialsResolver {
    constructor(private productMaterialsService: ProductMaterialsService) {}

    @Query(() => [ProductMaterial])
    async getProductMaterials(): Promise<ProductMaterial[]> {
        return this.productMaterialsService.getProductMaterials();
    }
}
