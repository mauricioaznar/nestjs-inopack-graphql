import { Module } from '@nestjs/common';
import { MachinesResolver } from './machines.resolver';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { MachinesService } from './machines.service';

@Module({
  providers: [PrismaService, MachinesResolver, MachinesService],
  exports: [MachinesResolver],
})
export class MachinesModule {}
