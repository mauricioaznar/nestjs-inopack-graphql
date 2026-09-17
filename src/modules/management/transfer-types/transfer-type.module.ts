import { Module } from '@nestjs/common';
import { TransferTypeResolver } from './transfer-type.resolver';
import { TransferTypeService } from './transfer-type.service';

@Module({
    providers: [TransferTypeResolver, TransferTypeService],
})
export class TransferTypeModule {}
