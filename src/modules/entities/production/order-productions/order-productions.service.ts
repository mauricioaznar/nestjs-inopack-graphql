import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import {
    OrderProduction,
    OrderProductionInput,
} from '../../../../common/dto/entities/production/order-production.dto';
import { OrderProductionProduct } from '../../../../common/dto/entities/production/order-production-product.dto';
import { vennDiagram } from '../../../../common/helpers';

@Injectable()
export class OrderProductionsService {
    constructor(private prisma: PrismaService) {}

    async getOrderProduction({
        order_production_id,
    }: {
        order_production_id: number;
    }): Promise<OrderProduction> {
        return this.prisma.order_productions.findUnique({
            where: {
                id: order_production_id,
            },
        });
    }

    async getOrderProductionProducts({
        order_production_id,
    }: {
        order_production_id: number;
    }): Promise<OrderProductionProduct[]> {
        return this.prisma.order_production_products.findMany({
            where: {
                AND: [
                    {
                        order_production_id: order_production_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async upsertOrderProduction(
        input: OrderProductionInput,
    ): Promise<OrderProduction> {
        const orderProduction = await this.prisma.order_productions.upsert({
            create: {
                start_date: input.start_date,
                waste: 0,
            },
            update: {
                start_date: input.start_date,
                waste: 0,
            },
            where: {
                id: input.id || 0,
            },
        });

        const newItems = input.order_production_products;
        const oldItems = input.id
            ? await this.prisma.order_production_products.findMany({
                  where: {
                      order_production_id: input.id,
                  },
              })
            : [];

        const {
            aMinusB: deleteSpareTransactions,
            bMinusA: createSpareTransactions,
            intersection: updateSpareTransactions,
        } = vennDiagram({
            a: oldItems,
            b: newItems,
            indexProperties: ['product_id', 'machine_id'],
        });

        for await (const delItem of deleteSpareTransactions) {
            await this.prisma.order_production_products.deleteMany({
                where: {
                    product_id: delItem.product_id,
                    machine_id: delItem.machine_id,
                },
            });
        }

        for await (const createItem of createSpareTransactions) {
            console.log(createItem);
            await this.prisma.order_production_products.create({
                data: {
                    product_id: createItem.product_id,
                    machine_id: createItem.machine_id,
                    kilos: createItem.kilos,
                    active: 1,
                    group_weight: 0,
                    groups: createItem.groups,
                },
            });
        }

        for await (const updateItem of updateSpareTransactions) {
            await this.prisma.order_production_products.updateMany({
                data: {
                    product_id: updateItem.product_id,
                    machine_id: updateItem.machine_id,
                    kilos: updateItem.kilos,
                    active: 1,
                    group_weight: 0,
                    groups: updateItem.groups,
                },
                where: {
                    product_id: updateItem.product_id,
                    machine_id: updateItem.machine_id,
                },
            });
        }

        return orderProduction;
    }
}
