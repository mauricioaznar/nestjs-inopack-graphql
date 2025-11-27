import { Injectable } from '@nestjs/common';
import {
    ExpenseResource,
    ExpenseResourcesPaginatedQueryArgs,
    ExpenseResourcesPaginatedSortableArgs,
    PaginatedResources,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { getRangesFromYearMonth } from '../../../common/helpers';
import { Prisma } from '@prisma/client';

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

    async paginatedExpenseResources({
        offsetPaginatorArgs,
        datePaginator,
        expenseResourcesQueryArgs,
        expenseResourcesSortArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: YearMonth;
        expenseResourcesQueryArgs: ExpenseResourcesPaginatedQueryArgs;
        expenseResourcesSortArgs: ExpenseResourcesPaginatedSortableArgs;
    }): Promise<PaginatedResources> {
        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
        });

        const { sort_order, sort_field } = expenseResourcesSortArgs;

        const filter =
            expenseResourcesQueryArgs.filter !== '' &&
            !!expenseResourcesQueryArgs.filter
                ? expenseResourcesQueryArgs.filter
                : undefined;

        const isFilterANumber = !Number.isNaN(Number(filter));

        const resourcesWhere: Prisma.resourcesWhereInput = {
            AND: [
                {
                    active: 1,
                },
            ],
        };
        let orderBy: Prisma.resourcesOrderByWithRelationInput = {
            updated_at: 'desc',
        };

        if (sort_order && sort_field) {
            if (sort_field === 'name') {
                orderBy = {
                    name: sort_order,
                };
            }
        }

        const resourcesCount = await this.prisma.resources.count({
            where: resourcesWhere,
        });

        const resources = await this.prisma.resources.findMany({
            where: resourcesWhere,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: orderBy,
        });

        return {
            count: resourcesCount,
            docs: resources,
        };
    }
}
