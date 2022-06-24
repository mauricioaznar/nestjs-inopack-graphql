import { Module } from '@nestjs/common';
import { ProductInventoryModule } from './product-inventory/product-inventory.module';

@Module({
    imports: [ProductInventoryModule],
})
export class SummariesModule {}
