import { Module } from '@nestjs/common';
import { SparesResolver } from './spares.resolver';
import { SparesService } from './spares.service';
import { SpareInventoryModule } from '../../../common/services/entities/spare-inventory.module';

@Module({
    imports: [SpareInventoryModule],
    providers: [SparesResolver, SparesService],
})
export class SparesModule {}
