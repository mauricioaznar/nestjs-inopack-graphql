import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  Part,
  PartInput,
  PartUpsertInput,
} from '../../../common/dto/entities/part.dto';
import { PartCategory } from '../../../common/dto/entities/part-category.dto';

@Injectable()
export class PartAdditionsService {
  constructor(private prisma: PrismaService) {}

  async getPart({
    part_addition_id,
  }: {
    part_addition_id: number;
  }): Promise<Part | null> {
    if (!part_addition_id) return null;
    return this.prisma.parts.findFirst({
      where: {
        id: part_addition_id,
      },
    });
  }
}
