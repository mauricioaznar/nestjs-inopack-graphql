import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import {
    OrderRequest,
    OrderRequestInput,
} from '../../../../common/dto/entities';

@Injectable()
export class OrderRequestsService {
    constructor(private prisma: PrismaService) {}

    async getOrderRequests(): Promise<OrderRequest[]> {
        return this.prisma.order_requests.findMany();
    }

    async getOrderRequest({
        orderRequestId,
    }: {
        orderRequestId: number;
    }): Promise<OrderRequest | null> {
        if (!orderRequestId) return null;

        return this.prisma.order_requests.findUnique({
            where: {
                id: orderRequestId,
            },
        });
    }

    async upsertOrderRequest(input: OrderRequestInput): Promise<OrderRequest> {
        return this.prisma.order_requests.upsert({
            create: {
                date: input.date,
                order_code: 0,
                estimated_delivery_date: input.date,
                priority: 0,
            },
            update: {
                date: input.date,
                order_code: 0,
                estimated_delivery_date: input.date,
                priority: 0,
            },
            where: {
                id: input.id || 0,
            },
        });
    }
}
