import { Logger, Module } from '@nestjs/common';
import { SpareSeederService } from './spare-seeder.service';
import { SparesModule } from '../../../maintenance/spares/spares.module';

@Module({
    // Import SparesModule for its exported service instead of re-declaring it.
    // PrismaService is global.
    imports: [SparesModule],
    providers: [Logger, SpareSeederService],
    exports: [SpareSeederService],
})
export class SpareSeederModule {}
