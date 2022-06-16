import { Module } from '@nestjs/common';
import { BranchesModule } from './branches/branches.module';
import { MachinesModule } from './machines/machines.module';
import { SparesModule } from './spares/spares.module';
import { SpareCategoriesModule } from './spare-categories/spare-categories.module';
import { MachineSectionsModule } from './machine-sections/machine-sections.module';
import { MachinePartsModule } from './machine-parts/machine-parts.module';
import { MachineCompatibilitiesModule } from './machine-compatibilities/machine-compatibilities.module';
import { SpareOperationsModule } from './spare-operations/spare-operations.module';
import { SpareTransactionsModule } from './spare-transactions/spare-transactions.module';

@Module({
    imports: [
        BranchesModule,
        MachinesModule,
        SparesModule,
        SpareCategoriesModule,
        MachineSectionsModule,
        MachinePartsModule,
        MachineCompatibilitiesModule,
        SpareOperationsModule,
        SpareTransactionsModule,
    ],
})
export class MaintenanceModule {}
