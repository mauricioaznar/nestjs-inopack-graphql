import { Logger, Module } from '@nestjs/common';
import { SpareSeederService } from './spare-seeder.service';
import { SparesService } from '../../../maintenance/spares/spares.service';

@Module({
    providers: [Logger, SparesService, SpareSeederService],
    exports: [SpareSeederService],
})
export class SpareSeederModule {}
