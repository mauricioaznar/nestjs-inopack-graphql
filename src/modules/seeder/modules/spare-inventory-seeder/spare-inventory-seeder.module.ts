import { Logger, Module } from '@nestjs/common';
import { SpareInventorySeederService } from './spare-inventory-seeder.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { SpareInventoryService } from '../../../../common/services/entities/spare-inventory.service';
import { SpareOperationsService } from '../../../entities/maintenance/spare-operations/spare-operations.service';

@Module({
    providers: [
        Logger,
        PrismaService,
        SpareInventoryService,
        SpareOperationsService,
        SpareInventorySeederService,
    ],
    exports: [SpareInventorySeederService],
})
export class SpareInventorySeederModule {}
