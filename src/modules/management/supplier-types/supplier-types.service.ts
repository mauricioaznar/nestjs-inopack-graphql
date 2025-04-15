import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { SupplierType } from '../../../common/dto/entities/management/supplier-type.dto';

@Injectable()
export class SupplierTypesService {
    constructor(private prisma: PrismaService) {}

    async getSupplierTypes(): Promise<SupplierType[]> {
        return this.prisma.supplier_type.findMany();
    }
}
