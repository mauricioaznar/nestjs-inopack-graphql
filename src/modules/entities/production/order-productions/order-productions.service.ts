import {
    BadRequestException,
    CACHE_MANAGER,
    Inject,
    Injectable,
} from '@nestjs/common';
import {
    OrderProduction,
    OrderProductionInput,
    PaginatedOrderProductions,
} from '../../../../common/dto/entities/production/order-production.dto';
import { OrderProductionProduct } from '../../../../common/dto/entities/production/order-production-product.dto';
import {
    getRangesFromYearMonth,
    vennDiagram,
} from '../../../../common/helpers';
import { OrderProductionEmployee } from '../../../../common/dto/entities/production/order-production-employee.dto';
import { Cache } from 'cache-manager';
import {
    OffsetPaginatorArgs,
    YearMonth,
} from '../../../../common/dto/pagination';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderProductionsService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

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

    async paginatedOrderProductions({
        offsetPaginatorArgs,
        datePaginator,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: YearMonth;
    }): Promise<PaginatedOrderProductions> {
        if (
            !datePaginator ||
            datePaginator?.year === null ||
            datePaginator?.month === null
        )
            return [];

        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
            value: 1,
            unit: 'month',
        });

        const orderProductionsWhere: Prisma.order_productionsWhereInput = {
            AND: [
                {
                    active: 1,
                },
                {
                    start_date: {
                        gte: startDate,
                    },
                },
                {
                    start_date: {
                        lt: endDate,
                    },
                },
            ],
        };

        const count = await this.prisma.order_productions.count({
            where: orderProductionsWhere,
        });
        const orderProductions = await this.prisma.order_productions.findMany({
            where: orderProductionsWhere,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
        });

        return {
            count: count,
            docs: orderProductions,
        };
    }

    async getOrderProductionEmployees({
        order_production_id,
    }: {
        order_production_id: number;
    }): Promise<OrderProductionEmployee[]> {
        return this.prisma.order_production_employees.findMany({
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

        const newProductItems = input.order_production_products;
        const oldProductItems = input.id
            ? await this.prisma.order_production_products.findMany({
                  where: {
                      order_production_id: input.id,
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
            indexProperties: ['product_id', 'machine_id'],
        });

        for await (const delItem of deleteProductItems) {
            await this.prisma.order_production_products.deleteMany({
                where: {
                    product_id: delItem.product_id,
                    machine_id: delItem.machine_id,
                    order_production_id: orderProduction.id,
                },
            });
            await this.cacheManager.del(
                `product_id_inventory_${delItem.product_id}`,
            );
        }

        for await (const createItem of createProductItems) {
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
            await this.cacheManager.del(
                `product_id_inventory_${createItem.product_id}`,
            );
        }

        for await (const updateItem of updateProductItems) {
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
                    order_production_id: orderProduction.id,
                },
            });
            await this.cacheManager.del(
                `product_id_inventory_${updateItem.product_id}`,
            );
        }

        const newEmployeeItems = input.order_production_employees;
        const oldEmployeeItems = input.id
            ? await this.prisma.order_production_employees.findMany({
                  where: {
                      order_production_id: input.id,
                  },
              })
            : [];

        const {
            aMinusB: deleteEmployeeItems,
            bMinusA: createEmployeeItems,
            intersection: updateEmployeeItems,
        } = vennDiagram({
            a: oldEmployeeItems,
            b: newEmployeeItems,
            indexProperties: ['employee_id'],
        });

        for await (const delItem of deleteEmployeeItems) {
            await this.prisma.order_production_employees.deleteMany({
                where: {
                    employee_id: delItem.employee_id,
                    order_production_id: orderProduction.id,
                },
            });
        }

        for await (const createItem of createEmployeeItems) {
            await this.prisma.order_production_employees.create({
                data: {
                    order_production_id: orderProduction.id,
                    employee_id: createItem.employee_id,
                    is_leader: createItem.is_leader,
                },
            });
        }

        for await (const updateItem of updateEmployeeItems) {
            await this.prisma.order_production_employees.updateMany({
                data: {
                    employee_id: updateItem.employee_id,
                    is_leader: updateItem.is_leader,
                },
                where: {
                    employee_id: updateItem.employee_id,
                    order_production_id: orderProduction.id,
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
                if (group_weight > 0 && kilos !== groups * group_weight) {
                    errors.push(
                        `product_id:${product_id} kilos/groups incorrectly calculated (${kilos} != ${
                            group_weight * groups
                        })`,
                    );
                }
            });
        }

        // AreProductsAndMachinesUnique
        {
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
                        errors.push(`machine_id and product_id are not unique`);
                    }
                },
            );
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

        // DoMachinesBelongToOrderProductionType
        {
            for await (const { machine_id } of orderProductionProducts) {
                const machine = await this.prisma.machines.findUnique({
                    where: {
                        id: machine_id,
                    },
                });
                if (
                    machine.order_production_type_id !==
                    input.order_production_type_id
                ) {
                    errors.push(
                        `Machine: ${machine_id} does not belong to order production id: ${input.order_production_type_id}`,
                    );
                }
            }
        }

        // DoProductsBelongToOrderProductionType
        {
            for await (const { product_id } of orderProductionProducts) {
                const product = await this.prisma.products.findUnique({
                    where: {
                        id: product_id,
                    },
                });
                if (
                    product.order_production_type_id !==
                    input.order_production_type_id
                ) {
                    errors.push(
                        `Product: ${product_id} does not belong to order production id: ${input.order_production_type_id}`,
                    );
                }
            }
        }

        const orderProductionEmployees = input.order_production_employees;

        // AreEmployeesUnique
        {
            orderProductionEmployees.forEach(
                ({ employee_id: employee_id_1 }) => {
                    let count = 0;
                    orderProductionEmployees.forEach(
                        ({ employee_id: employee_id_2 }) => {
                            if (employee_id_1 === employee_id_2) {
                                count = count + 1;
                            }
                        },
                    );
                    if (count >= 2) {
                        errors.push(
                            `employee_id (${employee_id_1}) are not unique`,
                        );
                    }
                },
            );
        }

        // DoEmployeesBelongToBranch
        {
            for await (const { employee_id } of orderProductionEmployees) {
                const employee = await this.prisma.employees.findUnique({
                    where: {
                        id: employee_id,
                    },
                });
                if (employee.branch_id !== input.branch_id) {
                    errors.push(
                        `Employee (${employee_id}) does not belong to branch (${input.branch_id})`,
                    );
                }
            }
        }

        // DoEmployeesBelongToOrderProductionType
        {
            for await (const { employee_id } of orderProductionEmployees) {
                const employee = await this.prisma.employees.findUnique({
                    where: {
                        id: employee_id,
                    },
                });
                if (
                    employee.order_production_type_id !==
                    input.order_production_type_id
                ) {
                    errors.push(
                        `Employee (${employee_id}) does not belong to order production type (${input.order_production_type_id})`,
                    );
                }
            }
        }

        // DoEmployeesHaveUpStatus
        {
            for await (const { employee_id } of orderProductionEmployees) {
                const employee = await this.prisma.employees.findUnique({
                    where: {
                        id: employee_id,
                    },
                });
                if (employee.employee_status_id !== 1) {
                    errors.push(
                        `Employee (${employee_id}) doesnt have up status (1)`,
                    );
                }
            }
        }

        // IsThereOnlyOneEmployeeLeader
        {
            for (const { is_leader: is_leader_1 } of orderProductionEmployees) {
                let count = 0;
                for (const {
                    is_leader: is_leader_2,
                } of orderProductionEmployees) {
                    if (is_leader_1 === 1 && is_leader_2 === 1) {
                        count = count + 1;
                    }
                }
                if (count >= 2) {
                    errors.push(`Only one leader can be selected`);
                }
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }
}
