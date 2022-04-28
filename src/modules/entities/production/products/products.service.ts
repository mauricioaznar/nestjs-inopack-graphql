import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { Product, ProductUpsertInput } from '../../../../common/dto/entities';
import { validate } from 'class-validator';

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
        const errors = await validate(input);

        console.log(errors);

        return this.prisma.products.upsert({
            create: {
                calibre: input.calibre,
                code: input.code,
                current_group_weight: input.current_group_weight,
                current_kilo_price: input.current_kilo_price,
                description: input.description,
                width: input.width,
                length: input.length,
            },
            update: {
                calibre: input.calibre,
                code: input.code,
                current_group_weight: input.current_group_weight,
                current_kilo_price: input.current_kilo_price,
                description: input.description,
                width: input.width,
                length: input.length,
            },
            where: {
                id: input.id || 0,
            },
        });
    }
}
