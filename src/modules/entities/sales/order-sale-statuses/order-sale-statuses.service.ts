import { Injectable } from '@nestjs/common';
import { OrderSaleStatus } from '../../../../common/dto/entities';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderSaleStatusesService {
    constructor(private prisma: PrismaService) {}

    async getOrderSaleStatuses(): Promise<OrderSaleStatus[]> {
        return this.prisma.order_sale_statuses.findMany();
    }
}
