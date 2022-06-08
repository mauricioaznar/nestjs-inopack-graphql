import { Machine } from '../../../dto/entities';
import { MachinesService } from '../../../../modules/entities/maintenance/machines/machines.service';
import { branch1 } from '../../objects/maintenance/branches';
import { orderProductionType1 } from '../../objects';

export async function createMachineForTesting({
    machinesService,
    order_production_type_id = orderProductionType1.id,
    branch_id = branch1.id,
}: {
    machinesService: MachinesService;
    order_production_type_id?: number;
    branch_id?: number;
}): Promise<Machine> {
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
