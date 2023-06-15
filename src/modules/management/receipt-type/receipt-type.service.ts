import { Injectable } from '@nestjs/common';
import { ReceiptType } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class ReceiptTypeService {
    constructor(private prisma: PrismaService) {}

    async getReceiptTypes(): Promise<ReceiptType[]> {
        return this.prisma.receipt_types.findMany();
    }
}
