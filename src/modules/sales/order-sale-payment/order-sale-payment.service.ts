import { Injectable } from '@nestjs/common';
import {
    OrderSale,
    OrderSalePayment,
    PaginatedOrderSalePayments,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { getRangesFromYearMonth } from '../../../common/helpers';
import { Prisma } from '@prisma/client';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';

@Injectable()
export class OrderSalePaymentService {
    constructor(private prisma: PrismaService) {}

    async paginatedOrderSalePayments({
        offsetPaginatorArgs,
        datePaginator,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: YearMonth;
    }): Promise<PaginatedOrderSalePayments> {
        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
        });

        const orderSalesWhere: Prisma.order_sale_paymentsWhereInput = {
            AND: [
                {
                    active: 1,
                },
                {
                    order_sales: {
                        date: {
                            gte: startDate,
                        },
                    },
                },
                {
                    order_sales: {
                        date: {
                            lt: datePaginator.year ? endDate : undefined,
                        },
                    },
                },
            ],
        };

        const orderSalesCount = await this.prisma.order_sale_payments.count({
            where: orderSalesWhere,
        });
        const orderSales = await this.prisma.order_sale_payments.findMany({
            where: orderSalesWhere,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: {
                updated_at: 'desc',
            },
        });

        return {
            count: orderSalesCount,
            docs: orderSales,
        };
    }

    async getOrderSalePayments(): Promise<OrderSalePayment[]> {
        return this.prisma.order_sale_payments.findMany();
    }

    async getOrderSale({
        order_sale_id,
    }: {
        order_sale_id?: number | null;
    }): Promise<OrderSale | null> {
        if (!order_sale_id) return null;

        return this.prisma.order_sales.findUnique({
            where: {
                id: order_sale_id,
            },
        });
    }
}
