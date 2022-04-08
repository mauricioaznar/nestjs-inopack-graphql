import { Logger, Module } from '@nestjs/common';
import { MachinePartsSeederService } from './machine-parts-seeder.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { MachineComponentsService } from '../../../entities/machine-components/machine-components.service';
import { MachineCompatibilitiesService } from '../../../entities/machine-compatibilities/machine-compatibilities.service';

@Module({
  providers: [
    Logger,
    PrismaService,
    MachineComponentsService,
    MachineCompatibilitiesService,
    MachinePartsSeederService,
  ],
  exports: [MachinePartsSeederService],
})
export class MachinePartsSeederModule {}
