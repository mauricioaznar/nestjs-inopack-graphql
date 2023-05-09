import { Logger, Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { SpareSeederModule } from './modules/spare-seeder/spare-seeder.module';
import { SpareCategorySeederModule } from './modules/spare-category-seeder/spare-category-seeder.module';
import { MachineSeederModule } from './modules/machine-seeder/machine-seeder.module';
import { SpareInventorySeederModule } from './modules/spare-inventory-seeder/spare-inventory-seeder.module';
import { PrismaService } from '../../common/modules/prisma/prisma.service';

@Module({
    providers: [Logger, SeederService, PrismaService],
    imports: [
        SpareSeederModule,
        SpareCategorySeederModule,
        MachineSeederModule,
        SpareInventorySeederModule,
    ],
})
export class SeederModule {}
