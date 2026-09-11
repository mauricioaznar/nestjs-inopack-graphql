import { Module } from '@nestjs/common';
import { SpareOperationsResolver } from './spare-operations.resolver';
import { SpareOperationsService } from './spare-operations.service';
import { SpareInventoryModule } from '../../../common/services/entities/spare-inventory.module';

@Module({
    imports: [SpareInventoryModule],
    providers: [SpareOperationsResolver, SpareOperationsService],
})
export class SpareOperationsModule {}
