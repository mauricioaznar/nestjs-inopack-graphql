import { Logger, Module } from '@nestjs/common';
import { MachineSeederService } from './machine-seeder.service';
import { MachinesModule } from '../../../maintenance/machines/machines.module';
import { MachineSectionsModule } from '../../../maintenance/machine-sections/machine-sections.module';
import { MachinePartsModule } from '../../../maintenance/machine-parts/machine-parts.module';

@Module({
    // Import the maintenance modules for their exported services instead of re-declaring
    // them (which created a second instance per service). PrismaService is global, and
    // SpareInventoryService (a dependency of MachinesService) resolves inside MachinesModule,
    // so this seeder no longer needs to provide either directly.
    imports: [MachinesModule, MachineSectionsModule, MachinePartsModule],
    providers: [Logger, MachineSeederService],
    exports: [MachineSeederService],
})
export class MachineSeederModule {}
