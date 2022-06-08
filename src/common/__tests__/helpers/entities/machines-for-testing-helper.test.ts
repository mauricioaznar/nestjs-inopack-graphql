import { ProductsService } from '../../../../modules/entities/production/products/products.service';
import { createProductForTesting } from './products-for-testing-helper';
import { setupApp } from '../setup-app';
import { INestApplication } from '@nestjs/common';
import {
    orderProductionType1,
    orderProductionType2,
    productType1,
    productType2,
} from '../../objects';
import { MachinesService } from '../../../../modules/entities/maintenance/machines/machines.service';
import { createMachineForTesting } from './machines-for-testing-helper';
import { branch1, branch2 } from '../../objects/maintenance/branches';

let app: INestApplication;
let machinesService: MachinesService;

beforeAll(async () => {
    app = await setupApp();
    machinesService = app.get(MachinesService);
});

afterAll(async () => {
    await app.close();
});

it('create machine for testing with its default values', async () => {
    const machine = await createMachineForTesting({
        machinesService,
    });

    expect(machine).toBeDefined();
    expect(machine.order_production_type_id).toBe(orderProductionType1.id);
    expect(machine.branch_id).toBe(branch1.id);
});

it('create machine for testing with its default values changed ', async () => {
    const machine = await createMachineForTesting({
        machinesService,
        order_production_type_id: orderProductionType2.id,
        branch_id: branch2.id,
    });

    expect(machine).toBeDefined();
    expect(machine.order_production_type_id).toBe(orderProductionType2.id);
    expect(machine.branch_id).toBe(branch2.id);
});
