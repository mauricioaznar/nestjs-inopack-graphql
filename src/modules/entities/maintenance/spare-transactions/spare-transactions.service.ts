import { Injectable } from '@nestjs/common';
import {
    Spare,
    SpareOperation,
    SpareTransaction,
} from '../../../../common/dto/entities';
import { getRangesFromYearMonth } from '../../../../common/helpers';
import { YearMonth } from '../../../../common/dto/pagination';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class SpareTransactionsService {
    constructor(private prisma: PrismaService) {}

    async getSpareTransactions(
        datePaginator: YearMonth,
    ): Promise<SpareTransaction[]> {
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

        return this.prisma.spare_transactions.findMany({
            where: {
                AND: [
                    {
                        spare_operations: {
                            date: {
                                gte: startDate,
                            },
                        },
                    },
                    {
                        spare_operations: {
                            date: {
                                lt: endDate,
                            },
                        },
                    },
                ],
            },
        });
    }

    async getSpare({
        spare_id,
    }: {
        spare_id: number | null;
    }): Promise<Spare | null> {
        if (!spare_id) return null;
        return this.prisma.spares.findFirst({
            where: {
                id: spare_id,
            },
        });
    }

    async getSpareOperation({
        spare_operation_id,
    }: {
        spare_operation_id: number | null;
    }): Promise<SpareOperation | null> {
        if (!spare_operation_id) return null;
        return this.prisma.spare_operations.findFirst({
            where: {
                id: spare_operation_id,
            },
        });
    }
}
