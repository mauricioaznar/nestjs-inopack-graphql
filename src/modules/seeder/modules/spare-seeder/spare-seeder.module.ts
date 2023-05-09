import { Logger, Module } from '@nestjs/common';
import { SpareSeederService } from './spare-seeder.service';
import { SparesService } from '../../../maintenance/spares/spares.service';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Module({
    providers: [Logger, SparesService, SpareSeederService, PrismaService],
    exports: [SpareSeederService],
})
export class SpareSeederModule {}
