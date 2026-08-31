import { Module } from '@nestjs/common';
import { ProductInventoryResolver } from './product-inventory.resolver';
import { ProductInventoryService } from './product-inventory-service';
import { ProductInventoryMovementsService } from './product-inventory-movements.service';

@Module({
    providers: [
        ProductInventoryResolver,
        ProductInventoryService,
        ProductInventoryMovementsService,
    ],
    exports: [ProductInventoryResolver],
})
export class ProductInventoryModule {}
