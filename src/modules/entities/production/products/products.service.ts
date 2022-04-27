import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { Product } from '../../../../common/dto/entities';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) {}

    async getProduct({
        product_id,
    }: {
        product_id: number | null;
    }): Promise<Product | null> {
        if (!product_id) return null;

        return this.prisma.products.findFirst({
            where: {
                id: product_id,
            },
        });
    }

    async getProducts(): Promise<Product[]> {
        return this.prisma.products.findMany();
    }
}
