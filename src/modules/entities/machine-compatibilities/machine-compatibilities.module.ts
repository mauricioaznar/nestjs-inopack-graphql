import { Module } from '@nestjs/common';
import { MachineCompatibilitiesResolver } from './machine-compatibilities.resolver';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { MachineCompatibilitiesService } from './machine-compatibilities.service';

@Module({
  providers: [
    PrismaService,
    MachineCompatibilitiesResolver,
    MachineCompatibilitiesService,
  ],
  exports: [MachineCompatibilitiesResolver],
})
export class MachineCompatibilitiesModule {}
