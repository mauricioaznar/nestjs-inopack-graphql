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

    const contactor900 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Contactor 900v',
    });
    const contactor700 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Contactor 700v',
    });
    const tornillo1 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Tornillo 1',
    });
    const tornillo2 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Tornillo 2',
    });
    const tornillo3 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Tornillo 3',
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
    const gomas1 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Goma circulares',
    });
    const gomas2 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Goma cuadradas',
    });

    const balero1 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Balero 1',
    });

    const piston1 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Piston 1',
    });
    const piston2 = await this.partsService.createPart({
      part_category_id: partCategoriesSeed.materials.id,
      name: 'Piston 2',
    });

    return {
      materials: {
        contactor400,
        contactor500,
        contactor700,
        contactor900,
        tornillo1,
        tornillo2,
        tornillo3,
        banda600,
        banda700,
        banda800,
        resistencia20,
        resistencia30,
        resistencia40,
        gomas1,
        gomas2,
        balero1,
        piston1,
        piston2,
      },
    };
  }
}
