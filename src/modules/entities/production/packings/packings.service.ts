import { Injectable } from '@nestjs/common';
import { Packing } from '../../../../common/dto/entities';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class PackingsService {
    constructor(private prisma: PrismaService) {}

    async getPackings(): Promise<Packing[]> {
        return this.prisma.packings.findMany();
    }
}
