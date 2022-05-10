import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderRequestStatus } from '../../../../common/dto/entities';

@Injectable()
export class OrderRequestStatusesService {
    constructor(private prisma: PrismaService) {}

    async getOrderRequestStatuses(): Promise<OrderRequestStatus[]> {
        return this.prisma.order_request_statuses.findMany();
    }
}
