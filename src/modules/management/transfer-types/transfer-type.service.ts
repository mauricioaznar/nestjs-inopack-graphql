import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { TransferType } from '../../../common/dto/entities/management/transfer-type.dto';

@Injectable()
export class TransferTypeService {
    constructor(private prisma: PrismaService) {}

    async getTransferTypes(): Promise<TransferType[]> {
        return this.prisma.transfer_type.findMany();
    }
}
