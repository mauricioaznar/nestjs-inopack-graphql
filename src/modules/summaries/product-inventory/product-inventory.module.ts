import { Module } from '@nestjs/common';
import { ProductInventoryResolver } from './product-inventory.resolver';
import { ProductInventoryService } from './product-inventory-service';

@Module({
    providers: [
        ProductInventoryResolver,
        ProductInventoryService,
    ],
    exports: [ProductInventoryResolver],
})
export class ProductInventoryModule {}
