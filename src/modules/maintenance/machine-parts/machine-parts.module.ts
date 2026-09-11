import { Module } from '@nestjs/common';
import { MachinePartsResolver } from './machine-parts.resolver';
import { MachinePartsService } from './machine-parts.service';

@Module({
    providers: [MachinePartsResolver, MachinePartsService],
})
export class MachinePartsModule {}
