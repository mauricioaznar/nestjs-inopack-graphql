import { Logger, Module } from '@nestjs/common';
import { PartSeederService } from './part-seeder.service';
import { PartsService } from '../../../entities/parts/parts.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';

@Module({
    providers: [Logger, PrismaService, PartsService, PartSeederService],
    exports: [PartSeederService],
})
export class PartSeederModule {}
