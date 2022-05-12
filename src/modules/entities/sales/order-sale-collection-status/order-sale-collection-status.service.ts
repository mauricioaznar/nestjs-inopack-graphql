import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderSaleCollectionStatus } from '../../../../common/dto/entities';

@Injectable()
export class OrderSaleCollectionStatusService {
    constructor(private prisma: PrismaService) {}

    async getOrderSaleCollectionStatuses(): Promise<
        OrderSaleCollectionStatus[]
    > {
        return this.prisma.order_sale_collection_statuses.findMany();
    }
}
