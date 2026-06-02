import { Injectable } from '@nestjs/common';
import {
    Spare,
    SpareOperation,
    SpareTransaction,
} from '../../../common/dto/entities';
import { getRangesFromDatePaginator } from '../../../common/helpers';
import { DatePaginator } from '../../../common/dto/pagination';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class SpareTransactionsService {
    constructor(private prisma: PrismaService) {}

    async getSpareTransactions(
        datePaginator: DatePaginator,
    ): Promise<SpareTransaction[]> {
        if (!datePaginator || !datePaginator.year || !datePaginator.month)
            return [];

        const { startDate, endDate } = getRangesFromDatePaginator({
            year: datePaginator.year,
            month: datePaginator.month,
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
        spare_operation_id?: number | null;
    }): Promise<SpareOperation | null> {
        if (!spare_operation_id) return null;
        return this.prisma.spare_operations.findFirst({
            where: {
                id: spare_operation_id,
            },
        });
    }
}
