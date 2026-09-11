import { Module } from '@nestjs/common';
import { MachinesResolver } from './machines.resolver';
import { MachinesService } from './machines.service';
import { SpareInventoryModule } from '../../../common/services/entities/spare-inventory.module';

@Module({
    imports: [SpareInventoryModule],
    providers: [MachinesResolver, MachinesService],
})
export class MachinesModule {}
