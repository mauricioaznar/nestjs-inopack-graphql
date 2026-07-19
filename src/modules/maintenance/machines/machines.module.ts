import { Module } from '@nestjs/common';
import { MachinesResolver } from './machines.resolver';
import { MachinesService } from './machines.service';
import { SpareInventoryService } from '../../../common/services/entities/spare-inventory.service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Module({
    providers: [
        MachinesResolver,
        SpareInventoryService,
        MachinesService,
        AuditUsersService,
    ],
    exports: [MachinesResolver],
})
export class MachinesModule {}
