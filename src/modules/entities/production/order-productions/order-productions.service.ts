import { BadRequestException, Injectable } from '@nestjs/common';
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
        await this.validateOrderProduction(input);

        const orderProduction = await this.prisma.order_productions.upsert({
            create: {
                start_date: input.start_date,
                branch_id: input.branch_id,
                waste: 0,
            },
            update: {
                start_date: input.start_date,
                branch_id: input.branch_id,
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
            await this.prisma.order_production_products.create({
                data: {
                    order_production_id: orderProduction.id,
                    product_id: createItem.product_id,
                    machine_id: createItem.machine_id,
                    kilos: createItem.kilos,
                    active: 1,
                    group_weight: createItem.group_weight,
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
                    group_weight: updateItem.group_weight,
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

    async validateOrderProduction(input: OrderProductionInput): Promise<void> {
        const errors: string[] = [];

        const orderProductionProducts = input.order_production_products;

        // IsProductGroupCorrectlyCalculated
        {
            orderProductionProducts.forEach((productionProduct) => {
                const { kilos, groups, group_weight, product_id } =
                    productionProduct;
                if (kilos !== groups * group_weight) {
                    errors.push(
                        `product_id:${product_id} kilos/groups incorrectly calculated`,
                    );
                }
            });
        }

        // AreProductsAndMachinesUnique
        {
            let isValid = true;
            orderProductionProducts.forEach(
                ({ machine_id: machine_id_1, product_id: product_id_1 }) => {
                    let count = 0;
                    orderProductionProducts.forEach(
                        ({
                            machine_id: machine_id_2,
                            product_id: product_id_2,
                        }) => {
                            if (
                                machine_id_1 === machine_id_2 &&
                                product_id_1 === product_id_2
                            ) {
                                count = count + 1;
                            }
                        },
                    );
                    if (count >= 2) {
                        isValid = false;
                    }
                },
            );
            if (!isValid) {
                errors.push(`machine_id and product_id are not unique`);
            }
        }

        // DoesMachineBelongToBranch
        {
            for await (const { machine_id } of orderProductionProducts) {
                const machine = await this.prisma.machines.findUnique({
                    where: {
                        id: machine_id,
                    },
                });
                if (machine.branch_id !== input.branch_id) {
                    errors.push(
                        `Machine: ${machine_id} does not belong to branch: ${input.branch_id}`,
                    );
                }
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }
}
