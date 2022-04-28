import { Module } from '@nestjs/common';
import { SparesResolver } from './spares.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { SparesService } from './spares.service';
import { SpareInventoryService } from '../../../../common/services/entities/spare-inventory.service';

@Module({
    providers: [
        PrismaService,
        SparesResolver,
        SparesService,
        SpareInventoryService,
    ],
    exports: [SparesResolver],
})
export class SparesModule {}
