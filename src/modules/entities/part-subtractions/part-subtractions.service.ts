import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { Part } from '../../../common/dto/entities/part.dto';

@Injectable()
export class PartSubtractionsService {
  constructor(private prisma: PrismaService) {}

  async getPart({ part_id }: { part_id: number | null }): Promise<Part | null> {
    if (!part_id) return null;
    return this.prisma.parts.findFirst({
      where: {
        id: part_id,
      },
    });
  }
}
