import { Module } from '@nestjs/common';
import { ReceiptTypeResolver } from './receipt-type.resolver';
import { ReceiptTypeService } from './receipt-type.service';

@Module({
    providers: [ReceiptTypeResolver, ReceiptTypeService],
    exports: [ReceiptTypeResolver],
})
export class ReceiptTypeModule {}
