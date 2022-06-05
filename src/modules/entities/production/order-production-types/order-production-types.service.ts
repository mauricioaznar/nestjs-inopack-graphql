import { Injectable } from '@nestjs/common';
import {
    OrderProductionType,
    OrderProductionTypeDailyProduction,
} from '../../../../common/dto/entities';
import { YearMonth } from '../../../../common/dto/pagination';
import dayjs from 'dayjs';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderProductionTypesService {
    constructor(private prisma: PrismaService) {}

    async getOrderProductionType({
        order_production_type_id,
    }: {
        order_production_type_id;
    }): Promise<OrderProductionType> {
        return this.prisma.order_production_type.findUnique({
            where: {
                id: order_production_type_id,
            },
        });
    }

    async getOrderProductionTypes(): Promise<OrderProductionType[]> {
        return this.prisma.order_production_type.findMany();
    }

    async getMonthProduction({
        orderProductionTypeId,
        year,
        month,
        branchId,
    }: {
        orderProductionTypeId: number;
        branchId: number | null;
    } & YearMonth): Promise<OrderProductionTypeDailyProduction[]> {
        const days: OrderProductionTypeDailyProduction[] = [];
        if (year === null || month === null) return days;

        let startDate = dayjs().utc().year(year).month(month).startOf('month');

        const endDate = dayjs()
            .utc()
            .year(year)
            .month(month)
            .add(1, 'month')
            .startOf('month');

        while (endDate.diff(startDate, 'days') > 0) {
            const {
                _sum: { kilos: kilosSum, groups: groupsSum },
            } = await this.prisma.order_production_products.aggregate({
                _sum: {
                    kilos: true,
                    groups: true,
                },
                where: {
                    AND: [
                        {
                            order_productions: {
                                start_date: {
                                    gte: startDate.toDate(),
                                },
                            },
                        },
                        {
                            order_productions: {
                                start_date: {
                                    lt: startDate.add(1, 'days').toDate(),
                                },
                            },
                        },
                        {
                            order_productions: {
                                active: 1,
                            },
                        },
                        {
                            active: 1,
                        },
                        {
                            order_productions: {
                                order_production_type_id: orderProductionTypeId,
                            },
                        },
                        {
                            order_productions: {
                                branch_id: branchId || undefined,
                            },
                        },
                    ],
                },
            });

            days.push({
                day: startDate.date(),
                month: startDate.month(),
                year: startDate.year(),
                kilo_sum: kilosSum || 0,
                group_sum: groupsSum || 0,
            });

            startDate = startDate.add(1, 'days');
        }

        return days;
    }
}
