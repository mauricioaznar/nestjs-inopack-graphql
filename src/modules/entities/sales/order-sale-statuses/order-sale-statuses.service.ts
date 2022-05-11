import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderSaleStatus } from '../../../../common/dto/entities';

@Injectable()
export class OrderSaleStatusesService {
    constructor(private prisma: PrismaService) {}

    async getOrderSaleStatuses(): Promise<OrderSaleStatus[]> {
        return this.prisma.order_sale_statuses.findMany();
    }
}
