import { Module } from '@nestjs/common';
import { MachineComponentCompatibilitiesResolver } from './machine-component-compatibilities.resolver';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { MachineComponentCompatibilitiesService } from './machine-component-compatibilities.service';

@Module({
  providers: [
    PrismaService,
    MachineComponentCompatibilitiesResolver,
    MachineComponentCompatibilitiesService,
  ],
  exports: [MachineComponentCompatibilitiesResolver],
})
export class MachineComponentCompatibilitiesModule {}
