import { Injectable } from '@nestjs/common';
import {
    Branch,
    ExpenseRawMaterialAddition,
    ExpenseResource,
    RawMaterialAddition,
    Resource,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class ExpenseRawMaterialAdditionsService {
    constructor(private prisma: PrismaService) {}

    async getExpenseRawMaterialAdditions(): Promise<
        ExpenseRawMaterialAddition[]
    > {
        return this.prisma.expense_raw_material_additions.findMany();
    }

    async getRawMaterialAddition({
        raw_material_addition_id,
    }: {
        raw_material_addition_id?: number | null;
    }): Promise<RawMaterialAddition | null> {
        if (!raw_material_addition_id) {
            return null;
        }

        return this.prisma.raw_material_additions.findFirst({
            where: {
                id: raw_material_addition_id,
            },
        });
    }

    async getBranch({
        branch_id,
    }: {
        branch_id?: number | null;
    }): Promise<Branch | null> {
        if (!branch_id) {
            return null;
        }

        return this.prisma.branches.findFirst({
            where: {
                id: branch_id,
            },
        });
    }
}
