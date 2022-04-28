import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { ProductType } from '../../../../common/dto/entities/production/product-type.dto';

@Injectable()
export class ProductTypesService {
    constructor(private prisma: PrismaService) {}

    async getProductTypes(): Promise<ProductType[]> {
        return this.prisma.product_type.findMany();
    }
}
