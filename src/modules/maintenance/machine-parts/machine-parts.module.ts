import { Module } from '@nestjs/common';
import { MachinePartsResolver } from './machine-parts.resolver';
import { MachinePartsService } from './machine-parts.service';

@Module({
    providers: [MachinePartsResolver, MachinePartsService],
    // Injected by MachineSeederModule (via imports), so exported rather than re-declared there.
    exports: [MachinePartsService],
})
export class MachinePartsModule {}
