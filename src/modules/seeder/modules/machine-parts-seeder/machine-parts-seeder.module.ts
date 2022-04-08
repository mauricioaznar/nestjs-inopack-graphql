import { Logger, Module } from '@nestjs/common';
import { MachinePartsSeederService } from './machine-parts-seeder.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { MachineComponentsService } from '../../../entities/machine-components/machine-components.service';
import { MachineComponentCompatibilitiesService } from '../../../entities/machine-component-compatibilities/machine-component-compatibilities.service';

@Module({
  providers: [
    Logger,
    PrismaService,
    MachineComponentsService,
    MachineComponentCompatibilitiesService,
    MachinePartsSeederService,
  ],
  exports: [MachinePartsSeederService],
})
export class MachinePartsSeederModule {}
