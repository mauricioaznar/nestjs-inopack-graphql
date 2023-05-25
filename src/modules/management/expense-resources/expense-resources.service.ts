import { Injectable } from '@nestjs/common';
import { ExpenseResource, Resource } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class ExpenseResourcesService {
    constructor(private prisma: PrismaService) {}

    async getExpenseResources(): Promise<ExpenseResource[]> {
        return this.prisma.expense_resources.findMany();
    }

    async getResource({
        resource_id,
    }: {
        resource_id?: number | null;
    }): Promise<Resource | null> {
        if (!resource_id) {
            return null;
        }

        return this.prisma.resources.findFirst({
            where: {
                id: resource_id,
            },
        });
    }
}
