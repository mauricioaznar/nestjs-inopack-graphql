import { Injectable, Logger } from '@nestjs/common';
import { PartsService } from '../../../entities/parts/parts.service';
import { PartCategoriesSeed } from '../../types/part-categories-seed';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';

@Injectable()
export class PartCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly partsService: PartsService,
  ) {}

  async createParts(partCategoriesSeed: PartCategoriesSeed): Promise<any> {
    return;
  }
}
