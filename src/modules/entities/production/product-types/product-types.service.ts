import { Injectable } from '@nestjs/common';
import { ProductType } from '../../../../common/dto/entities/production/product-type.dto';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class ProductTypesService {
    constructor(private prisma: PrismaService) {}

    async getProductTypes(): Promise<ProductType[]> {
        return this.prisma.product_type.findMany();
    }
}
