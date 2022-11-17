import { Injectable } from '@nestjs/common';
import { ProductType } from '../../../common/dto/entities/production/product-type.dto';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { ProductCategory } from '../../../common/dto/entities/production/product-category.dto';

@Injectable()
export class ProductCategoriesService {
    constructor(private prisma: PrismaService) {}

    async getProductCategories(): Promise<ProductCategory[]> {
        return this.prisma.product_categories.findMany();
    }
}
