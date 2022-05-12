import { Module } from '@nestjs/common';
import { OrderSaleResolver } from './order-sale.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderSaleService } from './order-sale.service';

@Module({
    providers: [PrismaService, OrderSaleResolver, OrderSaleService],
    exports: [OrderSaleResolver],
})
export class OrderSaleModule {}
