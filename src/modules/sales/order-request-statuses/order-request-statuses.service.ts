import { Injectable } from '@nestjs/common';
import { OrderRequestStatus } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderRequestStatusesService {
    constructor(private prisma: PrismaService) {}

    async getOrderRequestStatuses(): Promise<OrderRequestStatus[]> {
        return this.prisma.order_request_statuses.findMany();
    }
}
