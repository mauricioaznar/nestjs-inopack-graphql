import { Logger, Module } from '@nestjs/common';
import { SpareInventorySeederService } from './spare-inventory-seeder.service';
import { SpareOperationsModule } from '../../../maintenance/spare-operations/spare-operations.module';
import { SpareInventoryModule } from '../../../../common/services/entities/spare-inventory.module';

@Module({
    // SpareInventorySeederService injects SpareInventoryService directly (SpareInventoryModule)
    // and SpareOperationsService (imported via SpareOperationsModule, exported there) — instead
    // of re-declaring them. PrismaService is global.
    imports: [SpareInventoryModule, SpareOperationsModule],
    providers: [Logger, SpareInventorySeederService],
    exports: [SpareInventorySeederService],
})
export class SpareInventorySeederModule {}
