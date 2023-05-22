import { Module } from '@nestjs/common';
import { PurchasesResolver } from './purchases.resolver';
import { PurchasesService } from './purchases.service';
import { SpareInventoryService } from '../../../common/services/entities/spare-inventory.service';

@Module({
    providers: [PurchasesResolver, PurchasesService],
    exports: [PurchasesResolver],
})
export class PurchasesModule {}
