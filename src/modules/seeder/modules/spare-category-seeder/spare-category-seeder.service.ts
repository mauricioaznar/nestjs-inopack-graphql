import { Injectable, Logger } from '@nestjs/common';
import { SpareCategoriesService } from '../../../entities/maintenance/spare-categories/spare-categories.service';
import { SpareCategoriesSeed } from '../../types/spare-categories-seed';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';

@Injectable()
export class SpareCategorySeederService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: Logger,
        private readonly spareCategoriesService: SpareCategoriesService,
    ) {}

    async createSpareCategories(): Promise<SpareCategoriesSeed> {
        const materials = await this.spareCategoriesService.upsertSpareCategory(
            {
                name: 'Materiales',
            },
        );

        return {
            materials,
        };
    }
}
