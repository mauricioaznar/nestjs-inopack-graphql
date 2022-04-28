import { Module } from '@nestjs/common';
import { MachinePartsResolver } from './machine-parts.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { MachinePartsService } from './machine-parts.service';

@Module({
    providers: [PrismaService, MachinePartsResolver, MachinePartsService],
    exports: [MachinePartsResolver],
})
export class MachinePartsModule {}
