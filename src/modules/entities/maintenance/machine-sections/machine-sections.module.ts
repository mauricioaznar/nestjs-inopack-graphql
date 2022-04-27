import { Module } from '@nestjs/common';
import { MachineSectionsResolver } from './machine-sections.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { MachineSectionsService } from './machine-sections.service';

@Module({
    providers: [PrismaService, MachineSectionsResolver, MachineSectionsService],
    exports: [MachineSectionsResolver],
})
export class MachineSectionsModule {}
