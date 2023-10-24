import { Module } from '@nestjs/common';
import { RawMaterialAdditionsResolver } from './raw-material-additions.resolver';
import { RawMaterialAdditionsService } from './raw-material-additions.service';

@Module({
    providers: [RawMaterialAdditionsResolver, RawMaterialAdditionsService],
    exports: [RawMaterialAdditionsResolver],
})
export class RawMaterialAdditionsModule {}
