import { Logger, Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { PartSeederModule } from './modules/part-seeder/part-seeder.module';
import { PartCategorySeederModule } from './modules/part-category-seeder/part-category-seeder.module';
import { MachineSeederModule } from './modules/machine-seeder/machine-seeder.module';
import { PartInventorySeederModule } from './modules/part-inventory-seeder/part-inventory-seeder.module';

@Module({
    providers: [Logger, SeederService, PrismaService],
    imports: [
        PartSeederModule,
        PartCategorySeederModule,
        MachineSeederModule,
        PartInventorySeederModule,
    ],
})
export class SeederModule {}
