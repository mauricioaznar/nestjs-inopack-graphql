import {
    BadRequestException,
    CACHE_MANAGER,
    Inject,
    Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import {
    OrderRequest,
    OrderRequestInput,
    OrderRequestProduct,
} from '../../../../common/dto/entities';
import { vennDiagram } from '../../../../common/helpers';
import { Cache } from 'cache-manager';
import { OrderAdjustmentInput } from '../../../../common/dto/entities/production/order-adjustment.dto';

@Injectable()
export class OrderRequestsService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

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

    async getOrderRequestProducts({
        order_request_id,
    }: {
        order_request_id: number;
    }): Promise<OrderRequestProduct[]> {
        return this.prisma.order_request_products.findMany({
            where: {
                AND: [
                    {
                        order_request_id: order_request_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async upsertOrderRequest(input: OrderRequestInput): Promise<OrderRequest> {
        await this.validateOrderRequest(input);

        const orderRequest = await this.prisma.order_requests.upsert({
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

        const newProductItems = input.order_request_products;
        const oldProductItems = input.id
            ? await this.prisma.order_request_products.findMany({
                  where: {
                      order_request_id: input.id,
                  },
              })
            : [];

        const {
            aMinusB: deleteProductItems,
            bMinusA: createProductItems,
            intersection: updateProductItems,
        } = vennDiagram({
            a: oldProductItems,
            b: newProductItems,
            indexProperties: ['id'],
        });

        for await (const delItem of deleteProductItems) {
            await this.prisma.order_request_products.deleteMany({
                where: {
                    id: delItem.id,
                },
            });
            await this.cacheManager.del(
                `product_id_inventory_${delItem.product_id}`,
            );
        }

        for await (const createItem of createProductItems) {
            await this.prisma.order_request_products.create({
                data: {
                    kilo_price: 0,
                    order_request_id: orderRequest.id,
                    product_id: createItem.product_id,
                    kilos: createItem.kilos,
                    active: 1,
                    group_weight: createItem.group_weight,
                    groups: createItem.groups,
                },
            });
            await this.cacheManager.del(
                `product_id_inventory_${createItem.product_id}`,
            );
        }

        for await (const updateItem of updateProductItems) {
            await this.prisma.order_request_products.updateMany({
                data: {
                    product_id: updateItem.product_id,
                    kilos: updateItem.kilos,
                    active: 1,
                    group_weight: updateItem.group_weight,
                    groups: updateItem.groups,
                },
                where: {
                    id: updateItem.id,
                },
            });
            await this.cacheManager.del(
                `product_id_inventory_${updateItem.product_id}`,
            );
        }

        return orderRequest;
    }

    async validateOrderRequest(input: OrderRequestInput): Promise<void> {
        const errors: string[] = [];

        const orderRequestProducts = input.order_request_products;

        // AreProductsUnique
        {
            orderRequestProducts.forEach(({ product_id: product_id_1 }) => {
                let count = 0;
                orderRequestProducts.forEach(({ product_id: product_id_2 }) => {
                    if (product_id_1 === product_id_2) {
                        count = count + 1;
                    }
                });
                if (count >= 2) {
                    errors.push(`product_id (${product_id_1}) are not unique`);
                }
            });
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }
}
