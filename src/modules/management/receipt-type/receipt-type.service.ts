import { Injectable } from '@nestjs/common';
import { ReceiptType } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class ReceiptTypeService {
    constructor(private prisma: PrismaService) {}

    async getReceiptTypes(): Promise<ReceiptType[]> {
        const receiptTypes = await this.prisma.receipt_types.findMany({
            where: {
                active: 1,
            },
        });

        return receiptTypes.map((receiptType) => ({
            ...receiptType,
            tax_rate: Number(receiptType.tax_rate),
        }));
    }
}
