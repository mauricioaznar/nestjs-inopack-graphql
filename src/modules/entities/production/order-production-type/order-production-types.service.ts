import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderProductionType } from '../../../../common/dto/entities';

@Injectable()
export class OrderProductionTypesService {
    constructor(private prisma: PrismaService) {}

    async getOrderProductionTypes(): Promise<OrderProductionType[]> {
        return this.prisma.order_production_type.findMany();
    }
}
