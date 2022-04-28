import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { Product, ProductUpsertInput } from '../../../../common/dto/entities';
import { minLength } from 'class-validator';

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

    async upsertInput(input: ProductUpsertInput): Promise<Product> {
        const codeMinLength = minLength(input.code, 10);
        if (!codeMinLength) {
            throw new BadRequestException(['Min length is not enough']);
        }

        return this.prisma.products.upsert({
            create: {
                calibre: input.calibre,
                code: input.code,
                current_group_weight: input.current_group_weight,
                current_kilo_price: input.current_kilo_price,
                description: input.description,
                width: input.width,
                length: input.length,
                product_type_id: input.product_type_id,
                order_production_type_id: input.order_production_type_id,
                packing_id: input.packing_id,
            },
            update: {
                calibre: input.calibre,
                code: input.code,
                current_group_weight: input.current_group_weight,
                current_kilo_price: input.current_kilo_price,
                description: input.description,
                width: input.width,
                length: input.length,
                product_type_id: input.product_type_id,
                order_production_type_id: input.order_production_type_id,
                packing_id: input.packing_id,
            },
            where: {
                id: input.id || 0,
            },
        });
    }
}
