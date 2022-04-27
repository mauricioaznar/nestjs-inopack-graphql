import { Module } from '@nestjs/common';
import { MachinesResolver } from './machines.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { MachinesService } from './machines.service';
import { PartInventoryService } from '../../../../common/services/entities/part-inventory.service';

@Module({
    providers: [
        PrismaService,
        MachinesResolver,
        PartInventoryService,
        MachinesService,
    ],
    exports: [MachinesResolver],
})
export class MachinesModule {}
