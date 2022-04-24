import { Module } from '@nestjs/common';
import { BranchesModule } from './branches/branches.module';
import { MachinesModule } from './machines/machines.module';
import { PartsModule } from './parts/parts.module';
import { PartCategoriesModule } from './part-categories/part-categories.module';
import { MachineSectionsModule } from './machine-sections/machine-sections.module';
import { MachineComponentsModule } from './machine-components/machine-components.module';
import { MachineCompatibilitiesModule } from './machine-compatibilities/machine-compatibilities.module';
import { PartOperationsModule } from './part-operations/part-operations.module';
import { PartTransactionsModule } from './part-transactions/part-transactions.module';

@Module({
    imports: [
        BranchesModule,
        MachinesModule,
        PartsModule,
        PartCategoriesModule,
        MachineSectionsModule,
        MachineComponentsModule,
        MachineCompatibilitiesModule,
        PartOperationsModule,
        PartTransactionsModule,
    ],
})
export class EntitiesModule {}
