import { Injectable, Logger } from '@nestjs/common';
import { PartsService } from '../../../entities/parts/parts.service';
import { PartCategoriesSeed } from '../../types/part-categories-seed';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { PartsSeed } from '../../types/parts-seed';

@Injectable()
export class PartSeederService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly partsService: PartsService,
  ) {}

  async createParts(
    partCategoriesSeed: PartCategoriesSeed,
  ): Promise<PartsSeed> {
    const contactor400 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Contactor 400v',
    });

    const contactor500 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Contactor 500v',
    });
    const tornillo1 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Tornillo 1',
    });

    const banda600 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Banda 600',
    });
    const banda700 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Banda 700',
    });

    const banda800 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Banda 800',
    });

    const resistencia20 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Resistencia 20',
    });

    const resistencia30 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Resistencia 30',
    });

    const resistencia40 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Resistencia 40',
    });

    return {
      materials: {
        contactor400,
        contactor500,
        tornillo1,
        banda600,
        banda700,
        banda800,
        resistencia20,
        resistencia30,
        resistencia40,
      },
    };
  }
}
