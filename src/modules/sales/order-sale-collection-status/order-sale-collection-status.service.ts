import { Injectable } from '@nestjs/common';
import { OrderSaleCollectionStatus } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderSaleCollectionStatusService {
    constructor(private prisma: PrismaService) {}

    async getOrderSaleCollectionStatuses(): Promise<
        OrderSaleCollectionStatus[]
    > {
        return this.prisma.order_sale_collection_statuses.findMany();
    }
}
