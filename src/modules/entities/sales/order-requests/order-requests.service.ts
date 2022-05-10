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
        console.log(input);
        return this.prisma.order_requests.upsert({
            create: {
                date: input.date,
                order_code: input.order_code,
                estimated_delivery_date: input.estimated_delivery_date,
                client_id: input.client_id,
                order_request_status_id: input.order_request_status_id,
                priority: 0,
            },
            update: {
                date: input.date,
                order_code: input.order_code,
                estimated_delivery_date: input.estimated_delivery_date,
                client_id: input.client_id,
                order_request_status_id: input.order_request_status_id,
                priority: 0,
            },
            where: {
                id: input.id || 0,
            },
        });
    }

    async isOrderRequestCodeOccupied({
        order_code,
        order_request_id,
    }: {
        order_request_id: number | null;
        order_code: number;
    }): Promise<boolean> {
        const orderRequest = await this.prisma.order_requests.findFirst({
            where: {
                AND: [
                    {
                        order_code: order_code,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });

        return order_request_id >= 0 && orderRequest
            ? orderRequest.id !== order_request_id
            : !!orderRequest;
    }
}
