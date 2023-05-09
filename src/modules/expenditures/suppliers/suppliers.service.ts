import { Injectable } from '@nestjs/common';
import { Supplier, SupplierUpsertInput } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class SuppliersService {
    constructor(private prisma: PrismaService) {}

    async createSupplier(
        supplierUpsertInput: SupplierUpsertInput,
    ): Promise<Supplier> {
        return this.prisma.suppliers.create({
            data: {
                name: supplierUpsertInput.name,
            },
        });
    }

    async getSuppliers(): Promise<Supplier[]> {
        return this.prisma.suppliers.findMany();
    }
}
