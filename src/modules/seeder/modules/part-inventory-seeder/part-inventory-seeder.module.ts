import { Logger, Module } from '@nestjs/common';
import { PartInventorySeederService } from './part-inventory-seeder.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { PartInventoryService } from '../../../../common/services/entities/part-inventory.service';
import { PartOperationsService } from '../../../entities/part-operations/part-operations.service';

@Module({
    providers: [
        Logger,
        PrismaService,
        PartInventoryService,
        PartOperationsService,
        PartInventorySeederService,
    ],
    exports: [PartInventorySeederService],
})
export class PartInventorySeederModule {}
