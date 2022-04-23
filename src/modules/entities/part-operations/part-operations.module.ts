import { Module } from '@nestjs/common';
import { PartOperationsResolver } from './part-operations.resolver';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { PartOperationsService } from './part-operations.service';
import { PartInventoryService } from '../../../common/services/entities/part-inventory.service';

@Module({
  providers: [
    PrismaService,
    PartOperationsResolver,
    PartOperationsService,
    PartInventoryService,
  ],
  exports: [PartOperationsResolver],
})
export class PartOperationsModule {}
