import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { Part, PartInput } from '../../../common/dto/entities/part.dto';

@Injectable()
export class PartsService {
  constructor(private prisma: PrismaService) {}

  async createPart(partInput: PartInput): Promise<Part> {
    return this.prisma.parts.create({
      data: {
        name: partInput.name,
        part_category_id: partInput.part_category_id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async updatePart(id: number, partInput: PartInput): Promise<Part> {
    return this.prisma.parts.update({
      data: {
        name: partInput.name,
        updated_at: new Date(),
        part_category_id: partInput.part_category_id,
      },
      where: {
        id,
      },
    });
  }

  async getParts(): Promise<Part[]> {
    return this.prisma.parts.findMany();
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
