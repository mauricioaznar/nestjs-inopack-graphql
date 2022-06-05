import { Module } from '@nestjs/common';
import { ProductTypesResolver } from './product-types.resolver';
import { ProductTypesService } from './product-types.service';

@Module({
    providers: [ProductTypesResolver, ProductTypesService],
    exports: [ProductTypesResolver],
})
export class ProductTypesModule {}
