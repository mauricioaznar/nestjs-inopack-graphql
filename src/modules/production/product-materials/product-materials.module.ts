import { Module } from '@nestjs/common';
import { ProductMaterialsResolver } from './product-materials.resolver';
import { ProductMaterialsService } from './product-materials.service';

@Module({
    providers: [ProductMaterialsResolver, ProductMaterialsService],
    exports: [ProductMaterialsResolver],
})
export class ProductMaterialsModule {}
