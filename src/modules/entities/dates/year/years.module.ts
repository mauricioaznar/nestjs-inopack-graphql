import { Module } from '@nestjs/common';
import { YearsResolver } from './years.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { YearsService } from './years.service';

@Module({
    providers: [PrismaService, YearsResolver, YearsService],
    exports: [YearsResolver],
})
export class YearsModule {}
