import { Module } from '@nestjs/common';
import { OrderProductionsResolver } from './order-productions.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderProductionsService } from './order-productions.service';

@Module({
    providers: [
        PrismaService,
        OrderProductionsResolver,
        OrderProductionsService,
    ],
    exports: [OrderProductionsResolver],
})
export class OrderProductionsModule {}
