import { Injectable } from '@nestjs/common';
import {
    Account,
    Expense,
    ExpenseResource,
    ExpenseResourcesPaginatedQueryArgs,
    ExpenseResourcesPaginatedSortableArgs,
    PaginatedExpenseResources,
    Resource,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { OffsetPaginatorArgs, DatePaginator } from '../../../common/dto/pagination';
import { getRangesFromDatePaginator } from '../../../common/helpers';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExpenseResourcesService {
    constructor(private prisma: PrismaService) {}

    async getExpenseResources(): Promise<ExpenseResource[]> {
        return this.prisma.expense_resources.findMany();
    }

    async getExpense({
        expense_id,
    }: {
        expense_id?: number | null;
    }): Promise<Expense | null> {
        if (!expense_id) {
            return null;
        }

        return this.prisma.expenses.findFirst({
            where: {
                id: expense_id,
            },
        });
    }

    async getAccount({
        expense_id,
    }: {
        expense_id?: number | null;
    }): Promise<Account | null> {
        if (!expense_id) {
            return null;
        }

        const expense = await this.prisma.expenses.findFirst({
            where: {
                id: expense_id,
            },
        });

        if (!expense || !expense.account_id) {
            return null;
        }

        return this.prisma.accounts.findFirst({
            where: {
                id: expense.account_id,
            },
        });
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
        datePaginator: DatePaginator;
        expenseResourcesQueryArgs: ExpenseResourcesPaginatedQueryArgs;
        expenseResourcesSortArgs: ExpenseResourcesPaginatedSortableArgs;
    }): Promise<PaginatedExpenseResources> {
        const { startDate, endDate } = getRangesFromDatePaginator({
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

        const resourcesWhere: Prisma.expense_resourcesWhereInput = {
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

        const resourcesCount = await this.prisma.expense_resources.count({
            where: resourcesWhere,
        });

        const resources = await this.prisma.expense_resources.findMany({
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
