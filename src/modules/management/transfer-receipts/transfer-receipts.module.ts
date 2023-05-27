import { Module } from '@nestjs/common';
import { TransferReceiptsResolver } from './transfer-receipts.resolver';
import { TransferReceiptsService } from './transfer-receipts.service';

@Module({
    providers: [TransferReceiptsResolver, TransferReceiptsService],
    exports: [TransferReceiptsResolver],
})
export class TransferReceiptsModule {}
