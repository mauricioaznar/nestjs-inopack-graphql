import { Module } from '@nestjs/common';
import { OrderSalesResolver } from './order-sales.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderSalesService } from './order-sales.service';

@Module({
    providers: [PrismaService, OrderSalesResolver, OrderSalesService],
    exports: [OrderSalesResolver],
})
export class OrderSalesModule {}
