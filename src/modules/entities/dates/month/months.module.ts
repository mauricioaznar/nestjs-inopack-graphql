import { Module } from '@nestjs/common';
import { MonthsResolver } from './months.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { MonthsService } from './months.service';

@Module({
    providers: [PrismaService, MonthsResolver, MonthsService],
    exports: [MonthsResolver],
})
export class MonthsModule {}
