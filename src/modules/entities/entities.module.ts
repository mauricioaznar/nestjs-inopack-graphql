import { Module } from '@nestjs/common';
import { BranchesModule } from './branches/branches.module';
import { MachinesModule } from './machines/machines.module';

@Module({
  imports: [BranchesModule, MachinesModule],
})
export class EntitiesModule {}
