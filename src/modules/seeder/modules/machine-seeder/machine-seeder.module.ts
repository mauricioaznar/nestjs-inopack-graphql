import { Logger, Module } from '@nestjs/common';
import { MachineSeederService } from './machine-seeder.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { PartCategoriesService } from '../../../entities/part-categories/part-categories.service';
import { MachinesService } from "../../../entities/machines/machines.service";

@Module({
  providers: [
    Logger,
    PrismaService,
    MachinesService,
    MachineSeederService,
  ],
  exports: [MachineSeederService],
})
export class MachineSeederModule {}
