import {
    BadRequestException,
    CACHE_MANAGER,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    OrderProduction,
    OrderProductionInput,
    OrderProductionQueryArgs,
    PaginatedOrderProductions,
} from '../../../common/dto/entities/production/order-production.dto';
import { OrderProductionProduct } from '../../../common/dto/entities/production/order-production-product.dto';
import {
    getCreatedAtProperty,
    getRangesFromYearMonth,
    getUpdatedAtProperty,
    vennDiagram,
} from '../../../common/helpers';
import { OrderProductionEmployee } from '../../../common/dto/entities/production/order-production-employee.dto';
import { Cache } from 'cache-manager';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { Branch, OrderProductionType } from '../../../common/dto/entities';
import dayjs from 'dayjs';

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
    }): Promise<OrderProduction | null> {
        return this.prisma.order_productions.findFirst({
            where: {
                id: order_production_id,
                active: 1,
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
        orderProductionQueryArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: YearMonth;
        orderProductionQueryArgs: OrderProductionQueryArgs;
    }): Promise<PaginatedOrderProductions> {
        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
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
                {
                    branch_id: orderProductionQueryArgs.branch_id || undefined,
                },
                {
                    order_production_type_id:
                        orderProductionQueryArgs.order_production_type_id ||
                        undefined,
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
            orderBy: {
                updated_at: 'desc',
            },
        });

        return {
            count: count || 0,
            docs: orderProductions || [],
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
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                start_date: input.start_date,
                branch_id: input.branch_id,
                order_production_type_id: input.order_production_type_id,
                waste: input.waste,
            },
            update: {
                ...getUpdatedAtProperty(),
                start_date: input.start_date,
                branch_id: input.branch_id,
                order_production_type_id: input.order_production_type_id,
                waste: input.waste,
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
            indexProperties: ['id'],
        });

        for await (const delItem of deleteProductItems) {
            await this.prisma.order_production_products.updateMany({
                data: {
                    ...getUpdatedAtProperty(),
                    active: -1,
                },
                where: {
                    product_id: delItem.product_id,
                    machine_id: delItem.machine_id,
                    order_production_id: orderProduction.id,
                },
            });
            // await this.cacheManager.del(`product_inventory`);
        }

        for await (const createItem of createProductItems) {
            await this.prisma.order_production_products.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    order_production_id: orderProduction.id,
                    product_id: createItem.product_id,
                    machine_id: createItem.machine_id,
                    kilos: createItem.kilos,
                    active: 1,
                    group_weight: createItem.group_weight,
                    groups: createItem.groups,
                },
            });
            // await this.cacheManager.del(`product_inventory`);
        }

        for await (const updateItem of updateProductItems) {
            await this.prisma.order_production_products.updateMany({
                data: {
                    ...getUpdatedAtProperty(),
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
            // await this.cacheManager.del(`product_inventory`);
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
            await this.prisma.order_production_employees.updateMany({
                data: {
                    ...getUpdatedAtProperty(),
                    active: -1,
                },
                where: {
                    employee_id: delItem.employee_id,
                    order_production_id: orderProduction.id,
                },
            });
        }

        for await (const createItem of createEmployeeItems) {
            await this.prisma.order_production_employees.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    order_production_id: orderProduction.id,
                    employee_id: createItem.employee_id,
                    is_leader: createItem.is_leader,
                },
            });
        }

        for await (const updateItem of updateEmployeeItems) {
            await this.prisma.order_production_employees.updateMany({
                data: {
                    ...getUpdatedAtProperty(),
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

        // IsOrderProductionTypeTheSameOnUpdate
        if (input.id) {
            const previousOrderProduction = await this.getOrderProduction({
                order_production_id: input.id,
            });

            if (
                previousOrderProduction?.order_production_type_id !==
                input.order_production_type_id
            ) {
                errors.push(`cant change order production type`);
            }
        }

        // IsOrderProductionTypeTheSameOnUpdate
        if (input.id) {
            const previousOrderProduction = await this.getOrderProduction({
                order_production_id: input.id,
            });

            if (previousOrderProduction?.branch_id !== input.branch_id) {
                errors.push(`cant change branch`);
            }
        }

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
                if (machine_id) {
                    const machine = await this.prisma.machines.findUnique({
                        where: {
                            id: machine_id,
                        },
                    });
                    if (machine && machine.branch_id !== input.branch_id) {
                        errors.push(
                            `Machine: ${machine_id} does not belong to branch: ${input.branch_id}`,
                        );
                    }
                }
            }
        }

        // DoMachinesBelongToOrderProductionType
        {
            for await (const { machine_id } of orderProductionProducts) {
                if (machine_id) {
                    const machine = await this.prisma.machines.findUnique({
                        where: {
                            id: machine_id,
                        },
                    });
                    if (
                        machine &&
                        machine.order_production_type_id !==
                            input.order_production_type_id
                    ) {
                        errors.push(
                            `Machine: ${machine_id} does not belong to order production type (${input.order_production_type_id})`,
                        );
                    }
                }
            }
        }

        // DoProductsBelongToOrderProductionType
        {
            for await (const { product_id } of orderProductionProducts) {
                if (product_id) {
                    const product = await this.prisma.products.findUnique({
                        where: {
                            id: product_id,
                        },
                    });
                    if (
                        product &&
                        product.order_production_type_id !==
                            input.order_production_type_id
                    ) {
                        errors.push(
                            `Product: ${product_id} does not belong to order production type: ${input.order_production_type_id}`,
                        );
                    }
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
                            `employee_id is not unique ((${employee_id_1}))`,
                        );
                    }
                },
            );
        }

        // DoEmployeesBelongToBranch
        {
            for await (const { employee_id } of orderProductionEmployees) {
                if (employee_id) {
                    const employee = await this.prisma.employees.findUnique({
                        where: {
                            id: employee_id,
                        },
                    });
                    if (employee && employee.branch_id !== input.branch_id) {
                        errors.push(
                            `employee_id does not belong to branch (employee_id: (${employee_id}), branch_id: ${input.branch_id})`,
                        );
                    }
                }
            }
        }

        // DoEmployeesBelongToOrderProductionType
        {
            for await (const { employee_id } of orderProductionEmployees) {
                if (employee_id) {
                    const employee = await this.prisma.employees.findUnique({
                        where: {
                            id: employee_id,
                        },
                    });
                    if (
                        employee &&
                        employee.order_production_type_id !==
                            input.order_production_type_id
                    ) {
                        errors.push(
                            `employee_id does not belong to order production type (employee_id: ${employee_id}, order_production_type_id: ${input.order_production_type_id})`,
                        );
                    }
                }
            }
        }

        // DoEmployeesHaveUpStatus
        {
            for await (const { employee_id } of orderProductionEmployees) {
                if (employee_id) {
                    const employee = await this.prisma.employees.findUnique({
                        where: {
                            id: employee_id,
                        },
                    });
                    if (employee && employee.employee_status_id !== 1) {
                        errors.push(
                            `employee_id does not have up status (1, employee_status_id: ${employee.employee_status_id})`,
                        );
                    }
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

    async deleteOrderProduction({
        order_production_id,
    }: {
        order_production_id: number;
    }): Promise<boolean> {
        const orderProduction = await this.getOrderProduction({
            order_production_id,
        });

        if (!orderProduction) {
            throw new NotFoundException();
        }

        await this.prisma.order_productions.update({
            data: {
                ...getUpdatedAtProperty(),
                active: -1,
            },
            where: {
                id: order_production_id,
            },
        });

        const orderProductionProducts = await this.getOrderProductionProducts({
            order_production_id,
        });

        for await (const orderProductionProduct of orderProductionProducts) {
            await this.prisma.order_production_products.update({
                data: {
                    ...getUpdatedAtProperty(),
                    active: -1,
                },

                where: {
                    id: orderProductionProduct.id,
                },
            });
        }

        const orderProductionEmployees = await this.getOrderProductionEmployees(
            {
                order_production_id,
            },
        );

        for await (const orderProductionEmployee of orderProductionEmployees) {
            await this.prisma.order_production_employees.update({
                data: {
                    ...getUpdatedAtProperty(),
                    active: -1,
                },

                where: {
                    id: orderProductionEmployee.id,
                },
            });
        }

        return true;
    }

    async getOrderProductionType({
        order_production_type_id,
    }: {
        order_production_type_id: number | null;
    }): Promise<OrderProductionType | null> {
        if (!order_production_type_id) {
            return null;
        }

        return this.prisma.order_production_type.findFirst({
            where: {
                id: order_production_type_id,
                active: 1,
            },
        });
    }

    async getBranch({
        branch_id,
    }: {
        branch_id: number | null;
    }): Promise<Branch | null> {
        if (!branch_id) {
            return null;
        }

        return this.prisma.branches.findFirst({
            where: {
                id: branch_id,
                active: 1,
            },
        });
    }
}
