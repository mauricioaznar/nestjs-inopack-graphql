import { Logger, Module } from '@nestjs/common';
import { SpareInventorySeederService } from './spare-inventory-seeder.service';
import { SpareInventoryService } from '../../../../common/services/entities/spare-inventory.service';
import { SpareOperationsService } from '../../../maintenance/spare-operations/spare-operations.service';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Module({
    providers: [
        Logger,
        SpareInventoryService,
        SpareOperationsService,
        SpareInventorySeederService,
        PrismaService,
    ],
    exports: [SpareInventorySeederService],
})
export class SpareInventorySeederModule {}
