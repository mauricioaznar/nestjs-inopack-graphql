import { Module } from '@nestjs/common';
import { OrderSaleReceiptTypeResolver } from './order-sale-receipt-type.resolver';
import { OrderSaleReceiptTypeService } from './order-sale-receipt-type.service';

@Module({
    providers: [OrderSaleReceiptTypeResolver, OrderSaleReceiptTypeService],
    exports: [OrderSaleReceiptTypeResolver],
})
export class OrderSaleReceiptTypeModule {}
