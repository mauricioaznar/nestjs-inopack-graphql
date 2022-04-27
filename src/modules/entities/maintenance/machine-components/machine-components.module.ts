import { Module } from '@nestjs/common';
import { MachineComponentsResolver } from './machine-components.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { MachineComponentsService } from './machine-components.service';

@Module({
    providers: [
        PrismaService,
        MachineComponentsResolver,
        MachineComponentsService,
    ],
    exports: [MachineComponentsResolver],
})
export class MachineComponentsModule {}
