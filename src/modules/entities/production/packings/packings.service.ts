import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { Packing } from '../../../../common/dto/entities';

@Injectable()
export class PackingsService {
    constructor(private prisma: PrismaService) {}

    async getPackings(): Promise<Packing[]> {
        return this.prisma.packings.findMany();
    }
}
