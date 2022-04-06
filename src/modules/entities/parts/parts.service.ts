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
      },
      where: {
        id,
      },
    });
  }

  async getParts(): Promise<Part[]> {
    return this.prisma.parts.findMany();
  }
}
