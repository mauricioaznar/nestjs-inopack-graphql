import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PartAdditionInput } from '../../dto/entities/part-additions.dto';
import { PartSubtractionInput } from '../../dto/entities/part-subtractions.dto';

@Injectable()
export class PartInventoryService {
  constructor(private prisma: PrismaService) {}

  async getCurrentQuantity(partId: number): Promise<number> {
    const additionsTotal = await this.getAdditionsTotal(partId);
    const subtractionsTotal = await this.getSubtractionTotal(partId);
    return additionsTotal - subtractionsTotal;
  }

  async createAddition(input: PartAdditionInput): Promise<void> {
    const doesPartExist = await this.doesPartExist(input.part_id);

    if (!doesPartExist) {
      throw new BadRequestException('Part not found');
    }

    await this.prisma.part_additions.create({
      data: {
        part_id: input.part_id,
        quantity: input.quantity,
        part_adjustment_id: input.part_adjustment_id || null,
      },
    });
  }

  async updateAddition(input: PartAdditionInput): Promise<void> {
    const doesPartExist = await this.doesPartExist(input.part_id);

    if (!doesPartExist) {
      throw new BadRequestException('Part not found');
    }

    await this.prisma.part_additions.updateMany({
      data: {
        part_id: input.part_id,
        quantity: input.quantity,
        part_adjustment_id: input.part_adjustment_id || null,
      },
      where: {
        part_id: input.part_id,
        part_adjustment_id: input.part_adjustment_id || undefined,
      },
    });
  }

  async deleteAddition(
    input: Omit<PartAdditionInput, 'quantity'>,
  ): Promise<void> {
    const doesPartExist = await this.doesPartExist(input.part_id);

    if (!doesPartExist) {
      throw new BadRequestException('Part not found');
    }

    await this.prisma.part_additions.deleteMany({
      where: {
        part_id: input.part_id,
        part_adjustment_id: input.part_adjustment_id || undefined,
      },
    });
  }

  async subtract(subtractionInput: PartSubtractionInput): Promise<void> {
    const doesPartExist = await this.doesPartExist(subtractionInput.part_id);

    if (!doesPartExist) {
      throw new BadRequestException('Part not found');
    }

    await this.prisma.part_additions.create({
      data: {
        part_id: subtractionInput.part_id,
        quantity: subtractionInput.quantity,
      },
    });
  }

  private async doesPartExist(partId: number): Promise<boolean> {
    return !!(await this.prisma.parts.findFirst({
      where: { id: partId },
    }));
  }

  private async getAdditionsTotal(partId: number): Promise<number> {
    const {
      _sum: { quantity },
    } = await this.prisma.part_additions.aggregate({
      _sum: {
        quantity: true,
      },
      where: {
        part_id: partId,
      },
    });
    return quantity || 0;
  }

  private async getSubtractionTotal(partId: number): Promise<number> {
    const {
      _sum: { quantity },
    } = await this.prisma.part_subtractions.aggregate({
      _sum: {
        quantity: true,
      },
      where: {
        part_id: partId,
      },
    });
    return quantity || 0;
  }
}
