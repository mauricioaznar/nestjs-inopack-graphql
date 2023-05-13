import { Module } from '@nestjs/common';
import { TransfersResolver } from './transfers.resolver';
import { TransfersService } from './transfers.service';
import { SpareInventoryService } from '../../../common/services/entities/spare-inventory.service';

@Module({
    providers: [TransfersResolver, TransfersService],
    exports: [TransfersResolver],
})
export class TransfersModule {}
