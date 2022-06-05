import { Module } from '@nestjs/common';
import { SparesResolver } from './spares.resolver';
import { SparesService } from './spares.service';
import { SpareInventoryService } from '../../../../common/services/entities/spare-inventory.service';

@Module({
    providers: [SparesResolver, SparesService, SpareInventoryService],
    exports: [SparesResolver],
})
export class SparesModule {}
