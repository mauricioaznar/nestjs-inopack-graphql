import { Module } from '@nestjs/common';
import { RawMaterialAdditionItemsResolver } from './raw-material-addition-items.resolver';
import { RawMaterialAdditionItemsService } from './raw-material-addition-items.service';

@Module({
    providers: [
        RawMaterialAdditionItemsResolver,
        RawMaterialAdditionItemsService,
    ],
    exports: [RawMaterialAdditionItemsResolver],
})
export class RawMaterialAdditionItemsModule {}
