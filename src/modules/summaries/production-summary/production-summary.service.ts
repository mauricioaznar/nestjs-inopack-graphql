import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ProductInventory } from '../../../common/dto/entities/production/product-inventory.dto';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { Product } from '../../../common/dto/entities';

@Injectable()
export class ProductionSummaryService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getProductionSummary(): Promise<boolean> {
        return true;
    }
}
