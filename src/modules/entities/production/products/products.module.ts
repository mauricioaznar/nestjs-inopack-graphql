import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './products.service';
import { ProductInventoryService } from '../../../../common/services/entities/product-inventory-service';

@Module({
    providers: [ProductsResolver, ProductsService, ProductInventoryService],
    exports: [ProductsResolver],
})
export class ProductsModule {}
