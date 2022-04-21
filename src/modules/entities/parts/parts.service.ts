import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { Part, PartUpsertInput } from '../../../common/dto/entities/part.dto';
import { PartCategory } from '../../../common/dto/entities/part-category.dto';

@Injectable()
export class PartsService {
  constructor(private prisma: PrismaService) {}

  async upsertPart(partInput: PartUpsertInput): Promise<Part> {
    return this.prisma.parts.upsert({
      create: {
        name: partInput.name,
        part_category_id: partInput.part_category_id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      update: {
        name: partInput.name,
        part_category_id: partInput.part_category_id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      where: {
        id: partInput.id || 0,
      },
    });
  }

  async getParts(): Promise<Part[]> {
    return this.prisma.parts.findMany();
  }

  async getPartCategory({
    part_category_id,
  }: {
    part_category_id: number | null;
  }): Promise<PartCategory> {
    if (!part_category_id) return null;
    return this.prisma.part_categories.findFirst({
      where: {
        id: part_category_id,
      },
    });
  }

  async getTotalRequiredQuantity(id: number): Promise<number> {
    const {
      _sum: { current_part_required_quantity },
    } = await this.prisma.machine_components.aggregate({
      _sum: {
        current_part_required_quantity: true,
      },
      where: {
        current_part_id: id,
      },
    });
    return current_part_required_quantity || 0;
  }
}
