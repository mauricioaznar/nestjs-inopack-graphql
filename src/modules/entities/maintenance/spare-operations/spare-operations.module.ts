import { Module } from '@nestjs/common';
import { SpareOperationsResolver } from './spare-operations.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { SpareOperationsService } from './spare-operations.service';
import { SpareInventoryService } from '../../../../common/services/entities/spare-inventory.service';

@Module({
    providers: [
        PrismaService,
        SpareOperationsResolver,
        SpareOperationsService,
        SpareInventoryService,
    ],
    exports: [SpareOperationsResolver],
})
export class SpareOperationsModule {}
