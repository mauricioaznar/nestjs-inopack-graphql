import { Module } from '@nestjs/common';
import { MachinesResolver } from './machines.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { MachinesService } from './machines.service';
import { SpareInventoryService } from '../../../../common/services/entities/spare-inventory.service';

@Module({
    providers: [
        PrismaService,
        MachinesResolver,
        SpareInventoryService,
        MachinesService,
    ],
    exports: [MachinesResolver],
})
export class MachinesModule {}