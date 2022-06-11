import { Machine } from '../../../dto/entities';
import { MachinesService } from '../../../../modules/entities/maintenance/machines/machines.service';
import { branch1 } from '../../objects/maintenance/branches';
import { orderProductionType1 } from '../../objects';
import { INestApplication } from '@nestjs/common';

export async function createMachineForTesting({
    app,
    order_production_type_id = orderProductionType1.id,
    branch_id = branch1.id,
}: {
    app: INestApplication;
    order_production_type_id?: number;
    branch_id?: number;
}): Promise<Machine> {
    const machinesService = app.get(MachinesService);

    try {
        return await machinesService.upsertMachine({
            name: 'Machine testing name',
            branch_id: branch_id,
            order_production_type_id: order_production_type_id,
        });
    } catch (e) {
        console.error(e);
    }

    throw new Error('createMachineForTesting failed');
}
