import { setupApp } from '../setup-app';
import { INestApplication } from '@nestjs/common';
import { orderProductionType1, orderProductionType2 } from '../../objects';
import { createMachineForTesting } from './machines-for-testing';
import { branch1, branch2 } from '../../objects/maintenance/branches';

let app: INestApplication;

beforeAll(async () => {
    app = await setupApp();
});

afterAll(async () => {
    await app.close();
});

it('create machine for testing with its default values', async () => {
    const machine = await createMachineForTesting({
        app,
    });

    expect(machine).toBeDefined();
    expect(machine.order_production_type_id).toBe(orderProductionType1.id);
    expect(machine.branch_id).toBe(branch1.id);
});

it('create machine for testing with its default values changed ', async () => {
    const machine = await createMachineForTesting({
        app,
        order_production_type_id: orderProductionType2.id,
        branch_id: branch2.id,
    });

    expect(machine).toBeDefined();
    expect(machine.order_production_type_id).toBe(orderProductionType2.id);
    expect(machine.branch_id).toBe(branch2.id);
});
