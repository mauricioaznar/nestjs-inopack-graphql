import { Injectable } from '@nestjs/common';
import { ExpenseResource } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class ExpenseResourcesService {
    constructor(private prisma: PrismaService) {}

    async getExpenseResources(): Promise<ExpenseResource[]> {
        return this.prisma.expense_resources.findMany();
    }

    async getExpenseResource({
        expense_resource_id,
    }: {
        expense_resource_id?: number | null;
    }): Promise<ExpenseResource | null> {
        if (!expense_resource_id) {
            return null;
        }

        return this.prisma.expense_resources.findFirst({
            where: {
                id: expense_resource_id,
            },
        });
    }
}
