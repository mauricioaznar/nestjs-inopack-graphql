import { Module } from '@nestjs/common';
import { ProductTypesResolver } from './product-types.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { ProductTypesService } from './product-types.service';

@Module({
    providers: [PrismaService, ProductTypesResolver, ProductTypesService],
    exports: [ProductTypesResolver],
})
export class ProductTypesModule {}
