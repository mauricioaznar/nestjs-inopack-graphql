import { INestApplication } from '@nestjs/common';
import { setupApp } from '../../../common/__tests__/helpers/setup-app';
import { MachinesService } from './machines.service';
import {
    branch1,
    branch2,
} from '../../../common/__tests__/objects/maintenance/branches';
import {
    orderProductionType1,
    orderProductionType2,
    productType1,
} from '../../../common/__tests__/objects';
import {
    createEmployeeForTesting,
    createMachineForTesting,
    createProductForTesting,
    getUtcDate,
} from '../../../common/__tests__/helpers';
import { OrderProductionsService } from '../../production/order-productions/order-productions.service';

let app: INestApplication;
let machinesService: MachinesService;
let orderProductionsService: OrderProductionsService;

beforeAll(async () => {
    app = await setupApp();
    machinesService = app.get(MachinesService);
    orderProductionsService = app.get(OrderProductionsService);
});

afterAll(async () => {
    await app.close();
});

describe('list', () => {
    it('gets list', async () => {
        const machines = await machinesService.getMachines();
        expect(Array.isArray(machines)).toBe(true);
    });
});

describe('upsert', () => {
    it('creates', async () => {
        const machine = await machinesService.upsertMachine({
            name: 'Machine 1',
            branch_id: branch1.id,
            order_production_type_id: orderProductionType1.id,
        });

        expect(machine.name).toMatch(/machine 1/i);
        expect(machine.order_production_type_id).toBe(orderProductionType1.id);
        expect(machine.branch_id).toBe(branch1.id);
    });

    it('Updates', async () => {
        const createdMachine = await machinesService.upsertMachine({
            name: 'Machine 1',
            branch_id: branch1.id,
            order_production_type_id: orderProductionType1.id,
        });

        const updatedMachine = await machinesService.upsertMachine({
            id: createdMachine.id,
            name: 'Machine 2',
            branch_id: branch2.id,
            order_production_type_id: orderProductionType1.id,
        });

        expect(createdMachine.id).toBe(updatedMachine.id);
        expect(updatedMachine.name).toMatch(/machine 2/i);
        expect(updatedMachine.branch_id).toBe(branch2.id);
    });

    it('doesnt update if order_production_type_id has changed', async () => {
        expect.hasAssertions();
        const createdMachine = await machinesService.upsertMachine({
            name: 'Machine 1',
            branch_id: branch1.id,
            order_production_type_id: orderProductionType1.id,
        });

        try {
            await machinesService.upsertMachine({
                id: createdMachine.id,
                name: 'Machine 2',
                branch_id: branch1.id,
                order_production_type_id: orderProductionType2.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/order_production_type cant change/i),
                ]),
            );
        }
    });
});

describe('gets machine', () => {
    it('returns machine', async () => {
        const createdMachine = await machinesService.upsertMachine({
            name: 'Machine 1',
            branch_id: branch1.id,
            order_production_type_id: orderProductionType1.id,
        });

        const getMachine = await machinesService.getMachine({
            machine_id: createdMachine.id,
        });

        expect(createdMachine.id).toBe(getMachine?.id);
        expect(getMachine?.name).toMatch(/machine 1/i);
        expect(getMachine?.branch_id).toBe(branch1.id);
        expect(getMachine?.order_production_type_id).toBe(
            orderProductionType1.id,
        );
    });
});

describe('deletes', () => {
    it('deletes machine', async () => {
        const createdMachine = await machinesService.upsertMachine({
            name: 'Machine 1',
            branch_id: branch1.id,
            order_production_type_id: orderProductionType1.id,
        });

        await machinesService.deleteMachine({
            machine_id: createdMachine.id,
        });

        const getMachine = await machinesService.getMachine({
            machine_id: createdMachine.id,
        });

        expect(getMachine).toBeFalsy();
    });

    it('fails to delete a machine when there are related order productions', async () => {
        expect.hasAssertions();

        const product = await createProductForTesting({
            app,
            product_type_id: productType1.id,
            order_production_type_id: orderProductionType1.id,
        });

        const machine = await createMachineForTesting({
            app,
        });

        const employee = await createEmployeeForTesting({
            app,
        });

        await orderProductionsService.upsertOrderProduction({
            start_date: getUtcDate(),
            waste: 0,
            order_production_products: [
                {
                    product_id: product.id,
                    groups: 1,
                    group_weight: product.current_group_weight,
                    kilos: product.current_group_weight,
                    machine_id: machine.id,
                },
            ],
            order_production_type_id: orderProductionType1.id,
            order_production_employees: [
                {
                    employee_id: employee.id,
                    is_leader: 1,
                },
            ],
            branch_id: branch1.id,
        });

        try {
            await machinesService.deleteMachine({
                machine_id: machine.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(`order productions`),
                ]),
            );
        }
    });

    it.todo('fails to delete a machine when there are related machine parts');

    it.todo(
        'fails to delete a machine when there are related machine sections',
    );
});
