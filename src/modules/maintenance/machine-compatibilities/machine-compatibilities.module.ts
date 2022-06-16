import { Module } from '@nestjs/common';
import { MachineCompatibilitiesResolver } from './machine-compatibilities.resolver';
import { MachineCompatibilitiesService } from './machine-compatibilities.service';

@Module({
    providers: [MachineCompatibilitiesResolver, MachineCompatibilitiesService],
    exports: [MachineCompatibilitiesResolver],
})
export class MachineCompatibilitiesModule {}
