import { Logger, Module } from '@nestjs/common';
import { PartInventorySeederService } from './part-inventory-seeder.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { PartInventoryService } from '../../../../common/services/entities/part-inventory.service';

@Module({
  providers: [
    Logger,
    PrismaService,
    PartInventoryService,
    PartInventorySeederService,
  ],
  exports: [PartInventorySeederService],
})
export class PartInventorySeederModule {}
