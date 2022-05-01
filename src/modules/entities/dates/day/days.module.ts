import { Module } from '@nestjs/common';
import { DaysResolver } from './days.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { DaysService } from './days.service';

@Module({
    providers: [PrismaService, DaysResolver, DaysService],
    exports: [DaysResolver],
})
export class DaysModule {}
