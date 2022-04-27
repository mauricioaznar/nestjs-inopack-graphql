import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { ProductsService } from './products.service';

@Module({
    providers: [PrismaService, ProductsResolver, ProductsService],
    exports: [ProductsResolver],
})
export class ProductsModule {}
