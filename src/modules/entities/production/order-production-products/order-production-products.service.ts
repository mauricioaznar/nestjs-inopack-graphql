import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderProduction } from '../../../../common/dto/entities/production/order-production.dto';

@Injectable()
export class OrderProductionProductsService {
    constructor(private prisma: PrismaService) {}

    async getOrderProductions(): Promise<OrderProduction[]> {
        return this.prisma.order_productions.findMany();
    }
}
