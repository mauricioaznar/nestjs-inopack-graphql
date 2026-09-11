import { Logger, Module } from '@nestjs/common';
import { SpareInventorySeederService } from './spare-inventory-seeder.service';
import { SpareOperationsService } from '../../../maintenance/spare-operations/spare-operations.service';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';
import { SpareInventoryModule } from '../../../../common/services/entities/spare-inventory.module';

@Module({
    imports: [SpareInventoryModule],
    providers: [
        Logger,
        SpareOperationsService,
        SpareInventorySeederService,
        PrismaService,
    ],
    exports: [SpareInventorySeederService],
})
export class SpareInventorySeederModule {}
