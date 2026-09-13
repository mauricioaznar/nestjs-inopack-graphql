import { Module } from '@nestjs/common';
import { MachineSectionsResolver } from './machine-sections.resolver';
import { MachineSectionsService } from './machine-sections.service';

@Module({
    providers: [MachineSectionsResolver, MachineSectionsService],
    // Injected by MachineSeederModule (via imports), so exported rather than re-declared there.
    exports: [MachineSectionsService],
})
export class MachineSectionsModule {}
