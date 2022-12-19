import { Injectable } from '@nestjs/common';
import {
    OrderSale,
    OrderSaleCollectionStatus,
    OrderSalePayment,
    OrderSalePaymentQueryArgs,
    OrderSalePaymentSortArgs,
    OrderSalePaymentUpdateInput,
    PaginatedOrderSalePayments,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    getRangesFromYearMonth,
    getUpdatedAtProperty,
} from '../../../common/helpers';
import { Prisma } from '@prisma/client';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';

@Injectable()
export class OrderSalePaymentService {
    constructor(private prisma: PrismaService) {}

    async paginatedOrderSalePayments({
        offsetPaginatorArgs,
        datePaginator,
        orderSalePaymentSortArgs,
        orderSalePaymentsQueryArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: YearMonth;
        orderSalePaymentSortArgs: OrderSalePaymentSortArgs;
        orderSalePaymentsQueryArgs: OrderSalePaymentQueryArgs;
    }): Promise<PaginatedOrderSalePayments> {
        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
        });

        const { sort_order, sort_field } = orderSalePaymentSortArgs;
        const { order_sale_collection_status_id, order_sale_receipt_type_id } =
            orderSalePaymentsQueryArgs;
        const filter =
            orderSalePaymentsQueryArgs.filter !== '' &&
            orderSalePaymentsQueryArgs.filter
                ? orderSalePaymentsQueryArgs.filter
                : undefined;

        const isFilterANumber = !Number.isNaN(Number(filter));

        const orderSalesWhere: Prisma.order_sale_paymentsWhereInput = {
            AND: [
                {
                    active: 1,
                },
                {
                    date_paid: {
                        gte: startDate,
                    },
                },
                {
                    date_paid: {
                        lt: datePaginator.year ? endDate : undefined,
                    },
                },
                {
                    order_sale_collection_status_id:
                        order_sale_collection_status_id !== null &&
                        order_sale_collection_status_id !== undefined
                            ? order_sale_collection_status_id
                            : undefined,
                },
                {
                    order_sales: {
                        order_sale_receipt_type_id:
                            order_sale_receipt_type_id !== null &&
                            order_sale_receipt_type_id !== undefined
                                ? order_sale_receipt_type_id
                                : undefined,
                    },
                },
                {
                    OR: [
                        {
                            order_sales: {
                                order_code: {
                                    in: isFilterANumber
                                        ? Number(filter)
                                        : undefined,
                                },
                            },
                        },
                        {
                            order_sales: {
                                order_requests: {
                                    order_code: {
                                        in: isFilterANumber
                                            ? Number(filter)
                                            : undefined,
                                    },
                                },
                            },
                        },
                        {
                            order_sales: {
                                invoice_code: {
                                    in: isFilterANumber
                                        ? Number(filter)
                                        : undefined,
                                },
                            },
                        },
                    ],
                },
                {
                    OR: [
                        {
                            order_sales: {
                                order_requests: {
                                    clients: {
                                        name: {
                                            contains: !isFilterANumber
                                                ? filter
                                                : undefined,
                                        },
                                    },
                                },
                            },
                        },
                        {
                            order_sales: {
                                order_requests: {
                                    clients: {
                                        abbreviation: {
                                            contains: !isFilterANumber
                                                ? filter
                                                : undefined,
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            ],
        };

        let orderSalesOrderBy: Prisma.order_sale_paymentsOrderByWithRelationInput =
            {
                updated_at: 'desc',
            };

        if (sort_order && sort_field) {
            if (sort_field === 'date_paid') {
                orderSalesOrderBy = {
                    date_paid: sort_order,
                };
            } else if (sort_field === 'order_code') {
                orderSalesOrderBy = {
                    order_sales: {
                        order_code: sort_order,
                    },
                };
            }
        }

        const orderSalesCount = await this.prisma.order_sale_payments.count({
            where: orderSalesWhere,
        });
        const orderSales = await this.prisma.order_sale_payments.findMany({
            where: orderSalesWhere,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: orderSalesOrderBy,
        });

        return {
            count: orderSalesCount,
            docs: orderSales,
        };
    }

    async getOrderSalePayment({
        order_sale_payment_id,
    }: {
        order_sale_payment_id: number | null;
    }): Promise<OrderSalePayment | null> {
        if (!order_sale_payment_id) {
            return null;
        }

        return this.prisma.order_sale_payments.findUnique({
            where: {
                id: order_sale_payment_id,
            },
        });
    }

    async updateOrderSalePayment(
        input: OrderSalePaymentUpdateInput,
    ): Promise<OrderSalePayment> {
        return await this.prisma.order_sale_payments.update({
            data: {
                ...getUpdatedAtProperty(),
                order_sale_collection_status_id:
                    input.order_sale_collection_status_id,
                date_paid: input.date_paid,
            },
            where: {
                id: input.id || 0,
            },
        });
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

    async getOrderSaleCollectionStatus({
        order_sale_collection_status_id,
    }: {
        order_sale_collection_status_id?: number | null;
    }): Promise<OrderSaleCollectionStatus | null> {
        if (!order_sale_collection_status_id) return null;

        return this.prisma.order_sale_collection_statuses.findUnique({
            where: {
                id: order_sale_collection_status_id,
            },
        });
    }
}
