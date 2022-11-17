import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { ProductMaterial } from '../../../common/dto/entities/production/product-material.dto';

@Injectable()
export class ProductMaterialsService {
    constructor(private prisma: PrismaService) {}

    async getProductMaterials(): Promise<ProductMaterial[]> {
        return this.prisma.product_materials.findMany();
    }
}
