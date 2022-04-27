import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import {
    Part,
    PartOperation,
    PartTransaction,
} from '../../../../common/dto/entities';
import dayjs from 'dayjs';
import { DatePaginatorArgs } from '../../../../common/dto/pagination';
import { getRangesFromYearMonth } from '../../../../common/helpers';

@Injectable()
export class PartTransactionsService {
    constructor(private prisma: PrismaService) {}

    async getPartTransactions(
        datePaginator: DatePaginatorArgs,
    ): Promise<PartTransaction[]> {
        if (
            !datePaginator ||
            datePaginator?.year === null ||
            datePaginator?.month === null
        )
            return [];

        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
            value: 1,
            unit: 'month',
        });

        return this.prisma.part_transactions.findMany({
            where: {
                AND: [
                    {
                        part_operations: {
                            date: {
                                gte: startDate,
                            },
                        },
                    },
                    {
                        part_operations: {
                            date: {
                                lt: endDate,
                            },
                        },
                    },
                ],
            },
        });
    }

    async getPart({
        part_id,
    }: {
        part_id: number | null;
    }): Promise<Part | null> {
        if (!part_id) return null;
        return this.prisma.parts.findFirst({
            where: {
                id: part_id,
            },
        });
    }

    async getPartOperation({
        part_operation_id,
    }: {
        part_operation_id: number | null;
    }): Promise<PartOperation | null> {
        if (!part_operation_id) return null;
        return this.prisma.part_operations.findFirst({
            where: {
                id: part_operation_id,
            },
        });
    }
}
