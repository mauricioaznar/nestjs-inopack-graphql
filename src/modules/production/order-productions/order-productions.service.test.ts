import { INestApplication } from '@nestjs/common';
import {
    createEmployeeForTesting,
    createMachineForTesting,
    createProductForTesting,
    getUtcDate,
    setupApp,
} from '../../../common/__tests__/helpers';
import { OrderProductionsService } from './order-productions.service';
import {
    branch1,
    branch2,
} from '../../../common/__tests__/objects/maintenance/branches';
import {
    orderProductionType1,
    orderProductionType2,
    productType2,
} from '../../../common/__tests__/objects';
import { OrderProductionInput } from '../../../common/dto/entities/production/order-production.dto';
import { employeeStatus2 } from '../../../common/__tests__/objects/maintenance/employee-statuses';

let orderProductionsService: OrderProductionsService;
let app: INestApplication;

beforeAll(async () => {
    app = await setupApp();
    orderProductionsService = app.get(OrderProductionsService);
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
            app,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
        });
        const machineForTesting = await createMachineForTesting({
            app,
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

    it('updates order production (bag)', async () => {
        const productForTesting = await createProductForTesting({
            app,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
        });
        const machineForTesting = await createMachineForTesting({
            app,
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

        const createdOrderProduction =
            await orderProductionsService.upsertOrderProduction(
                orderProductionInput,
            );

        const createdOrderProductionProducts =
            await orderProductionsService.getOrderProductionProducts({
                order_production_id: createdOrderProduction.id,
            });

        const createdOrderProductionEmployees =
            await orderProductionsService.getOrderProductionEmployees({
                order_production_id: createdOrderProduction.id,
            });

        const updatedOrderProduction =
            await orderProductionsService.upsertOrderProduction({
                id: createdOrderProduction.id,
                order_production_type_id: orderProductionType1.id,
                waste: 10,
                start_date: getUtcDate({
                    year: 2023,
                    day: 2,
                    month: 3,
                }),
                branch_id: branch1.id,
                order_production_products: [
                    {
                        id: createdOrderProductionProducts[0].id,
                        product_id: productForTesting.id,
                        groups: 2,
                        group_weight: productForTesting.current_group_weight,
                        kilos: productForTesting.current_group_weight * 2,
                        machine_id: machineForTesting.id,
                    },
                ],
                order_production_employees: [
                    {
                        id: createdOrderProductionEmployees[0].id,
                        employee_id: employeeForTesting.id,
                        is_leader: 1,
                    },
                ],
            });

        const updatedOrderProductionProducts =
            await orderProductionsService.getOrderProductionProducts({
                order_production_id: createdOrderProduction.id,
            });

        const updatedOrderProductionEmployees =
            await orderProductionsService.getOrderProductionEmployees({
                order_production_id: createdOrderProduction.id,
            });

        expect(updatedOrderProduction.order_production_type_id).toBe(
            orderProductionType1.id,
        );
        expect(updatedOrderProduction.branch_id).toBe(branch1.id);
        expect(updatedOrderProduction.start_date.toISOString()).toMatch(
            /2023-04-02/i,
        );
        expect(updatedOrderProductionProducts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: createdOrderProductionProducts[0].id,
                    product_id: productForTesting.id,
                    groups: 2,
                    group_weight: productForTesting.current_group_weight,
                    kilos: productForTesting.current_group_weight * 2,
                    machine_id: machineForTesting.id,
                }),
            ]),
        );

        expect(updatedOrderProductionEmployees).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    employee_id: employeeForTesting.id,
                    is_leader: 1,
                }),
            ]),
        );
    });

    it('creates order production (roll)', async () => {
        const productForTesting = await createProductForTesting({
            app,
            product_type_id: productType2.id,
            order_production_type_id: orderProductionType2.id,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
            order_production_type_id: orderProductionType2.id,
        });
        const machineForTesting = await createMachineForTesting({
            app,
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
            app,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
        });
        const machineForTesting = await createMachineForTesting({
            app,
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

    it('doesnt allow to change branch when updating', async () => {
        expect.hasAssertions();

        const productForTesting = await createProductForTesting({
            app,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
        });
        const machineForTesting = await createMachineForTesting({
            app,
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
                branch_id: branch2.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/cant change branch/i),
                ]),
            );
        }
    });

    it('fails when kilos and groups are not correctly calculated', async () => {
        expect.hasAssertions();

        const productForTesting = await createProductForTesting({
            app,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
        });
        const machineForTesting = await createMachineForTesting({
            app,
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
            app,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
        });
        const machineForTesting = await createMachineForTesting({
            app,
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
            app,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
        });
        const machineForTesting = await createMachineForTesting({
            app,
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
            app,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
        });
        const machineForTesting = await createMachineForTesting({
            app,
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

    it('fails when product does not belong to order production type', async () => {
        expect.hasAssertions();

        const productForTesting = await createProductForTesting({
            app,
            order_production_type_id: orderProductionType2.id,
            product_type_id: productType2.id,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
        });
        const machineForTesting = await createMachineForTesting({
            app,
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

    it('fails when employees are not unique', async () => {
        expect.hasAssertions();

        const productForTesting = await createProductForTesting({
            app,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
        });
        const machineForTesting = await createMachineForTesting({
            app,
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
                    expect.stringMatching(/employee_id is not unique/i),
                ]),
            );
        }
    });

    it('fails when employee does not belong to branch', async () => {
        expect.hasAssertions();

        const productForTesting = await createProductForTesting({
            app,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
            branch_id: branch2.id,
        });
        const machineForTesting = await createMachineForTesting({
            app,
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
                        /employee_id does not belong to branch/i,
                    ),
                ]),
            );
        }
    });

    it('fails when employee does not belong to order production type', async () => {
        expect.hasAssertions();

        const productForTesting = await createProductForTesting({
            app,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
            order_production_type_id: orderProductionType2.id,
        });
        const machineForTesting = await createMachineForTesting({
            app,
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
                        /employee_id does not belong to order production type/i,
                    ),
                ]),
            );
        }
    });

    it('fails when employee does not have up status', async () => {
        expect.hasAssertions();

        const productForTesting = await createProductForTesting({
            app,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
            employee_status_id: employeeStatus2.id,
        });
        const machineForTesting = await createMachineForTesting({
            app,
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
                        /employee_id does not have up status/i,
                    ),
                ]),
            );
        }
    });

    it('fails when there are to employee leaders', async () => {
        expect.hasAssertions();

        const productForTesting = await createProductForTesting({
            app,
        });
        const employeeForTesting1 = await createEmployeeForTesting({
            app,
        });

        const employeeForTesting2 = await createEmployeeForTesting({
            app,
        });
        const machineForTesting = await createMachineForTesting({
            app,
        });

        const orderProductionInput: OrderProductionInput = {
            branch_id: branch1.id,
            order_production_type_id: orderProductionType1.id,
            waste: 0,
            start_date: getUtcDate({ year: 2022, day: 1, month: 0 }),
            order_production_employees: [
                {
                    employee_id: employeeForTesting1.id,
                    is_leader: 1,
                },
                {
                    employee_id: employeeForTesting2.id,
                    is_leader: 1,
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
                    expect.stringMatching(/only one leader can be selected/i),
                ]),
            );
        }
    });
});

describe('gets', () => {
    it('gets order production', async () => {
        const productForTesting = await createProductForTesting({
            app,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
        });
        const machineForTesting = await createMachineForTesting({
            app,
        });

        const createdOrderProduction =
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

        const orderProduction =
            await orderProductionsService.getOrderProduction({
                order_production_id: createdOrderProduction.id,
            });

        expect(orderProduction?.id).toBe(createdOrderProduction.id);

        expect(orderProduction?.order_production_type_id).toBe(
            orderProductionType1.id,
        );
        expect(orderProduction?.branch_id).toBe(branch1.id);
        expect(orderProduction?.start_date.toISOString()).toMatch(
            /2022-01-01/i,
        );
    });
});

describe('deletes', () => {
    it('deletes order production and its related entities (order_production_products and order_production_employees)', async () => {
        const productForTesting = await createProductForTesting({
            app,
        });
        const employeeForTesting = await createEmployeeForTesting({
            app,
        });
        const machineForTesting = await createMachineForTesting({
            app,
        });

        const createdOrderProduction =
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

        await orderProductionsService.deleteOrderProduction({
            order_production_id: createdOrderProduction.id,
        });

        const orderProduction =
            await orderProductionsService.getOrderProduction({
                order_production_id: createdOrderProduction.id,
            });

        const orderProductionProducts =
            await orderProductionsService.getOrderProductionProducts({
                order_production_id: createdOrderProduction.id,
            });

        const orderProductionEmployees =
            await orderProductionsService.getOrderProductionEmployees({
                order_production_id: createdOrderProduction.id,
            });

        expect(orderProduction).toBeFalsy();
        expect(orderProductionProducts.length).toBe(0);
        expect(orderProductionEmployees.length).toBe(0);
    });
});
