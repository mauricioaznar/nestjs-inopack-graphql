import { Module } from '@nestjs/common';
import { PackingsResolver } from './packings.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { PackingsService } from './packings.service';

@Module({
    providers: [PrismaService, PackingsResolver, PackingsService],
    exports: [PackingsResolver],
})
export class PackingsModule {}
