import { Module } from '@nestjs/common';
import { MachinesResolver } from './machines.resolver';
import { MachinesService } from './machines.service';
import { SpareInventoryService } from '../../../../common/services/entities/spare-inventory.service';

@Module({
    providers: [MachinesResolver, SpareInventoryService, MachinesService],
    exports: [MachinesResolver],
})
export class MachinesModule {}
