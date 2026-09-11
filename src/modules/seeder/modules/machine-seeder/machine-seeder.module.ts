import { Logger, Module } from '@nestjs/common';
import { MachineSeederService } from './machine-seeder.service';
import { MachinesService } from '../../../maintenance/machines/machines.service';
import { MachineSectionsService } from '../../../maintenance/machine-sections/machine-sections.service';
import { MachinePartsService } from '../../../maintenance/machine-parts/machine-parts.service';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';
import { SpareInventoryModule } from '../../../../common/services/entities/spare-inventory.module';

@Module({
    imports: [SpareInventoryModule],
    providers: [
        Logger,
        MachinesService,
        MachineSectionsService,
        MachinePartsService,
        MachineSeederService,
        PrismaService,
    ],
    exports: [MachineSeederService],
})
export class MachineSeederModule {}
