import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { ProductsService } from './products.service';
import { ProductInventoryService } from '../../../../common/services/entities/product-inventory-service';

@Module({
    providers: [
        PrismaService,
        ProductsResolver,
        ProductsService,
        ProductInventoryService,
    ],
    exports: [ProductsResolver],
})
export class ProductsModule {}
