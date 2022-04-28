import { Logger, Module } from '@nestjs/common';
import { SpareSeederService } from './spare-seeder.service';
import { SparesService } from '../../../entities/maintenance/spares/spares.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';

@Module({
    providers: [Logger, PrismaService, SparesService, SpareSeederService],
    exports: [SpareSeederService],
})
export class SpareSeederModule {}
