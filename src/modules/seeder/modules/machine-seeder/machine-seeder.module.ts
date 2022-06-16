import { Logger, Module } from '@nestjs/common';
import { MachineSeederService } from './machine-seeder.service';
import { MachinesService } from '../../../maintenance/machines/machines.service';
import { MachineSectionsService } from '../../../maintenance/machine-sections/machine-sections.service';
import { MachinePartsService } from '../../../maintenance/machine-parts/machine-parts.service';
import { SpareInventoryService } from '../../../../common/services/entities/spare-inventory.service';

@Module({
    providers: [
        Logger,
        MachinesService,
        MachineSectionsService,
        MachinePartsService,
        MachineSeederService,
        SpareInventoryService,
    ],
    exports: [MachineSeederService],
})
export class MachineSeederModule {}
