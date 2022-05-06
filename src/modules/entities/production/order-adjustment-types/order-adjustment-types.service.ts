import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderAdjustmentType } from '../../../../common/dto/entities/production/order-adjustment-type.dto';

@Injectable()
export class OrderAdjustmentTypesService {
    constructor(private prisma: PrismaService) {}

    async getOrderAdjustmentType({
        order_adjustment_type_id,
    }: {
        order_adjustment_type_id;
    }): Promise<OrderAdjustmentType> {
        return this.prisma.order_adjustment_type.findUnique({
            where: {
                id: order_adjustment_type_id,
            },
        });
    }

    async getOrderAdjustmentTypes(): Promise<OrderAdjustmentType[]> {
        return this.prisma.order_adjustment_type.findMany();
    }
}
