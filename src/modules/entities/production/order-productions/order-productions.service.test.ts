import { INestApplication } from '@nestjs/common';
import { ClientsService } from '../../sales/clients/clients.service';
import {
    createEmployeeForTesting,
    createMachineForTesting,
    createProductForTesting,
    getUtcDate,
    setupApp,
} from '../../../../common/__tests__/helpers';
import { ProductsService } from '../products/products.service';
import { OrderProductionsService } from './order-productions.service';
import { EmployeesService } from '../employees/employees.service';
import {
    branch1,
    branch2,
} from '../../../../common/__tests__/objects/maintenance/branches';
import {
    orderProductionType1,
    orderProductionType2,
    productType2,
} from '../../../../common/__tests__/objects';
import { MachinesService } from '../../maintenance/machines/machines.service';
import { OrderProductionInput } from '../../../../common/dto/entities/production/order-production.dto';

let app: INestApplication;
let productsService: ProductsService;
let orderProductionsService: OrderProductionsService;
let employeesService: EmployeesService;
let machinesService: MachinesService;

beforeAll(async () => {
    app = await setupApp();
    productsService = app.get(ProductsService);
    orderProductionsService = app.get(OrderProductionsService);
    employeesService = app.get(EmployeesService);
    machinesService = app.get(MachinesService);
});

afterAll(async () => {
    await app.close();
});

describe('pagination', () => {
    it('returns paginated list list', async () => {
        const paginatedResults =
            await orderProductionsService.paginatedOrderProductions({
                datePaginator: {
                    month: 1,
                    year: 2022,
                },
                offsetPaginatorArgs: {
                    take: 10,
                    skip: 0,
                },
            });

        expect(Array.isArray(paginatedResults.docs)).toBe(true);
    });
});

describe('upsert', () => {
    it('creates order production (bag)', async () => {
        const productForTesting = await createProductForTesting({
            productsService,
        });
        const employeeForTesting = await createEmployeeForTesting({
            employeesService,
        });
        const machineForTesting = await createMachineForTesting({
            machinesService,
        });

        const orderProduction =
            await orderProductionsService.upsertOrderProduction({
                branch_id: branch1.id,
                order_production_type_id: orderProductionType1.id,
                waste: 0,
                start_date: getUtcDate({ year: 2022, day: 1, month: 0 }),
                order_production_employees: [
                    {
                        employee_id: employeeForTesting.id,
                        is_leader: 0,
                    },
                ],
                order_production_products: [
                    {
                        product_id: productForTesting.id,
                        groups: 1,
                        group_weight: productForTesting.current_group_weight,
                        kilos: productForTesting.current_group_weight,
                        machine_id: machineForTesting.id,
                    },
                ],
            });

        const orderProductionProducts =
            await orderProductionsService.getOrderProductionProducts({
                order_production_id: orderProduction.id,
            });

        const orderProductionEmployees =
            await orderProductionsService.getOrderProductionEmployees({
                order_production_id: orderProduction.id,
            });

        expect(orderProduction.order_production_type_id).toBe(
            orderProductionType1.id,
        );
        expect(orderProduction.branch_id).toBe(branch1.id);
        expect(orderProduction.start_date.toISOString()).toMatch(/2022-01-01/i);
        expect(orderProductionProducts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    product_id: productForTesting.id,
                    groups: 1,
                    group_weight: productForTesting.current_group_weight,
                    kilos: productForTesting.current_group_weight,
                    machine_id: machineForTesting.id,
                }),
            ]),
        );

        expect(orderProductionEmployees).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    employee_id: employeeForTesting.id,
                    is_leader: 0,
                }),
            ]),
        );
    });

    it('creates order production (roll)', async () => {
        const productForTesting = await createProductForTesting({
            productsService,
            product_type_id: productType2.id,
            order_production_type_id: orderProductionType2.id,
        });
        const employeeForTesting = await createEmployeeForTesting({
            employeesService,
            order_production_type_id: orderProductionType2.id,
        });
        const machineForTesting = await createMachineForTesting({
            machinesService,
            order_production_type_id: orderProductionType2.id,
        });

        const orderProduction =
            await orderProductionsService.upsertOrderProduction({
                branch_id: branch1.id,
                order_production_type_id: orderProductionType2.id,
                waste: 0,
                start_date: getUtcDate({ year: 2022, day: 1, month: 0 }),
                order_production_employees: [
                    {
                        employee_id: employeeForTesting.id,
                        is_leader: 0,
                    },
                ],
                order_production_products: [
                    {
                        product_id: productForTesting.id,
                        groups: 200,
                        group_weight: productForTesting.current_group_weight,
                        kilos: 52,
                        machine_id: machineForTesting.id,
                    },
                ],
            });

        const orderProductionProducts =
            await orderProductionsService.getOrderProductionProducts({
                order_production_id: orderProduction.id,
            });

        const orderProductionEmployees =
            await orderProductionsService.getOrderProductionEmployees({
                order_production_id: orderProduction.id,
            });

        expect(orderProduction.order_production_type_id).toBe(
            orderProductionType2.id,
        );
        expect(orderProduction.branch_id).toBe(branch1.id);
        expect(orderProduction.start_date.toISOString()).toMatch(/2022-01-01/i);
        expect(orderProductionProducts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    product_id: productForTesting.id,
                    groups: 200,
                    group_weight: productForTesting.current_group_weight,
                    kilos: 52,
                    machine_id: machineForTesting.id,
                }),
            ]),
        );

        expect(orderProductionEmployees).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    employee_id: employeeForTesting.id,
                    is_leader: 0,
                }),
            ]),
        );
    });

    it('doesnt allow to change order production type when updating', async () => {
        expect.hasAssertions();

        const productForTesting = await createProductForTesting({
            productsService,
        });
        const employeeForTesting = await createEmployeeForTesting({
            employeesService,
        });
        const machineForTesting = await createMachineForTesting({
            machinesService,
        });

        const orderProductionInput: OrderProductionInput = {
            branch_id: branch1.id,
            order_production_type_id: orderProductionType1.id,
            waste: 0,
            start_date: getUtcDate({ year: 2022, day: 1, month: 0 }),
            order_production_employees: [
                {
                    employee_id: employeeForTesting.id,
                    is_leader: 0,
                },
            ],
            order_production_products: [
                {
                    product_id: productForTesting.id,
                    groups: 1,
                    group_weight: productForTesting.current_group_weight,
                    kilos: productForTesting.current_group_weight,
                    machine_id: machineForTesting.id,
                },
            ],
        };

        const orderProduction =
            await orderProductionsService.upsertOrderProduction(
                orderProductionInput,
            );

        try {
            await orderProductionsService.upsertOrderProduction({
                ...orderProductionInput,
                id: orderProduction.id,
                order_production_type_id: orderProductionType2.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/cant change order production type/i),
                ]),
            );
        }
    });

    it('fails when kilos and groups are not correctly calculated', async () => {
        expect.hasAssertions();

        const productForTesting = await createProductForTesting({
            productsService,
        });
        const employeeForTesting = await createEmployeeForTesting({
            employeesService,
        });
        const machineForTesting = await createMachineForTesting({
            machinesService,
        });

        const orderProductionInput: OrderProductionInput = {
            branch_id: branch1.id,
            order_production_type_id: orderProductionType1.id,
            waste: 0,
            start_date: getUtcDate({ year: 2022, day: 1, month: 0 }),
            order_production_employees: [
                {
                    employee_id: employeeForTesting.id,
                    is_leader: 0,
                },
            ],
            order_production_products: [
                {
                    product_id: productForTesting.id,
                    groups: 1,
                    group_weight: productForTesting.current_group_weight,
                    kilos: productForTesting.current_group_weight * 3,
                    machine_id: machineForTesting.id,
                },
            ],
        };

        try {
            await orderProductionsService.upsertOrderProduction(
                orderProductionInput,
            );
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([expect.stringMatching(/calculated/i)]),
            );
        }
    });

    it('fails when products and machines are not unique', async () => {
        expect.hasAssertions();

        const productForTesting = await createProductForTesting({
            productsService,
        });
        const employeeForTesting = await createEmployeeForTesting({
            employeesService,
        });
        const machineForTesting = await createMachineForTesting({
            machinesService,
        });

        const orderProductionInput: OrderProductionInput = {
            branch_id: branch1.id,
            order_production_type_id: orderProductionType1.id,
            waste: 0,
            start_date: getUtcDate({ year: 2022, day: 1, month: 0 }),
            order_production_employees: [
                {
                    employee_id: employeeForTesting.id,
                    is_leader: 0,
                },
            ],
            order_production_products: [
                {
                    product_id: productForTesting.id,
                    groups: 1,
                    group_weight: productForTesting.current_group_weight,
                    kilos: productForTesting.current_group_weight,
                    machine_id: machineForTesting.id,
                },
                {
                    product_id: productForTesting.id,
                    groups: 1,
                    group_weight: productForTesting.current_group_weight,
                    kilos: productForTesting.current_group_weight,
                    machine_id: machineForTesting.id,
                },
            ],
        };

        try {
            await orderProductionsService.upsertOrderProduction(
                orderProductionInput,
            );
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(
                        /machine_id and product_id are not unique/i,
                    ),
                ]),
            );
        }
    });

    it('fails when machine does not belong to branch', async () => {
        expect.hasAssertions();

        const productForTesting = await createProductForTesting({
            productsService,
        });
        const employeeForTesting = await createEmployeeForTesting({
            employeesService,
        });
        const machineForTesting = await createMachineForTesting({
            machinesService,
        });

        const orderProductionInput: OrderProductionInput = {
            branch_id: branch2.id,
            order_production_type_id: orderProductionType1.id,
            waste: 0,
            start_date: getUtcDate({ year: 2022, day: 1, month: 0 }),
            order_production_employees: [
                {
                    employee_id: employeeForTesting.id,
                    is_leader: 0,
                },
            ],
            order_production_products: [
                {
                    product_id: productForTesting.id,
                    groups: 1,
                    group_weight: productForTesting.current_group_weight,
                    kilos: productForTesting.current_group_weight,
                    machine_id: machineForTesting.id,
                },
            ],
        };

        try {
            await orderProductionsService.upsertOrderProduction(
                orderProductionInput,
            );
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/does not belong to branch/i),
                ]),
            );
        }
    });

    it('fails when machine does not belong to order production type', async () => {
        expect.hasAssertions();

        const productForTesting = await createProductForTesting({
            productsService,
        });
        const employeeForTesting = await createEmployeeForTesting({
            employeesService,
        });
        const machineForTesting = await createMachineForTesting({
            machinesService,
            order_production_type_id: orderProductionType2.id,
        });

        const orderProductionInput: OrderProductionInput = {
            branch_id: branch1.id,
            order_production_type_id: orderProductionType1.id,
            waste: 0,
            start_date: getUtcDate({ year: 2022, day: 1, month: 0 }),
            order_production_employees: [
                {
                    employee_id: employeeForTesting.id,
                    is_leader: 0,
                },
            ],
            order_production_products: [
                {
                    product_id: productForTesting.id,
                    groups: 1,
                    group_weight: productForTesting.current_group_weight,
                    kilos: productForTesting.current_group_weight,
                    machine_id: machineForTesting.id,
                },
            ],
        };

        try {
            await orderProductionsService.upsertOrderProduction(
                orderProductionInput,
            );
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(
                        /does not belong to order production type/i,
                    ),
                ]),
            );
        }
    });
});
