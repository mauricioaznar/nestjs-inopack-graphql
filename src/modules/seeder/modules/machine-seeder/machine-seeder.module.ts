import { Logger, Module } from '@nestjs/common';
import { MachineSeederService } from './machine-seeder.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { MachinesService } from '../../../entities/maintenance/machines/machines.service';
import { MachineSectionsService } from '../../../entities/maintenance/machine-sections/machine-sections.service';
import { MachineComponentsService } from '../../../entities/maintenance/machine-components/machine-components.service';
import { PartInventoryService } from '../../../../common/services/entities/part-inventory.service';

@Module({
    providers: [
        Logger,
        PrismaService,
        MachinesService,
        MachineSectionsService,
        MachineComponentsService,
        MachineSeederService,
        PartInventoryService,
    ],
    exports: [MachineSeederService],
})
export class MachineSeederModule {}
