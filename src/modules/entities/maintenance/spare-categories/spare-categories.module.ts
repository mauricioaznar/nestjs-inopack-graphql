import { Module } from '@nestjs/common';
import { SpareCategoriesResolver } from './spare-categories.resolver';
import { SpareCategoriesService } from './spare-categories.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';

@Module({
    providers: [PrismaService, SpareCategoriesResolver, SpareCategoriesService],
    exports: [SpareCategoriesResolver],
})
export class SpareCategoriesModule {}
