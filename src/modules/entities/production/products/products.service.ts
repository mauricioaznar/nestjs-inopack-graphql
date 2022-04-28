import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { Product, ProductUpsertInput } from '../../../../common/dto/entities';
import { isEmpty, isNotEmpty, minLength } from 'class-validator';
import { isRequiredArgument } from 'graphql';

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
        const errors = await this.validateUpsertInput(input);

        if (errors.length > 0) {
            throw new BadRequestException(errors);
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

    async validateUpsertInput(input: ProductUpsertInput): Promise<string[]> {
        const errors: string[] = [];

        // width
        if (ProductsService.isWidthRequired(input) && isEmpty(input.width)) {
            errors.push('Width is required');
        }

        // length
        if (ProductsService.isLengthRequired(input) && isEmpty(input.length)) {
            errors.push('Length is required');
        }

        // current group weight
        if (
            ProductsService.isCurrentGroupWeightRequired(input) &&
            isEmpty(input.current_group_weight)
        ) {
            errors.push('Current group weight is required');
        }

        // calibre
        if (
            ProductsService.isCalibreRequired(input) &&
            isEmpty(input.calibre)
        ) {
            errors.push('Calibre is required');
        }

        // packing
        if (
            ProductsService.isPackingIdRequired(input) &&
            isEmpty(input.packing_id)
        ) {
            errors.push('Packing is required');
        }

        return errors;
    }

    static isBag(input: ProductUpsertInput) {
        return input.order_production_type_id === 1;
    }

    static isRoll(input: ProductUpsertInput) {
        return input.order_production_type_id === 2;
    }

    static isPellet(input: ProductUpsertInput) {
        return input.order_production_type_id === 3;
    }

    static isOthers(input: ProductUpsertInput) {
        return input.order_production_type_id === null;
    }

    static isWidthRequired(input: ProductUpsertInput) {
        return (
            ProductsService.isBag(input) ||
            ProductsService.isRoll(input) ||
            ProductsService.isOthers(input)
        );
    }

    static isLengthRequired(input: ProductUpsertInput) {
        return ProductsService.isBag(input) || ProductsService.isOthers(input);
    }

    static isCurrentGroupWeightRequired(input: ProductUpsertInput) {
        return ProductsService.isBag(input) || ProductsService.isOthers(input);
    }

    static isCalibreRequired(input: ProductUpsertInput) {
        return (
            ProductsService.isBag(input) ||
            ProductsService.isRoll(input) ||
            ProductsService.isOthers(input)
        );
    }

    static isPackingIdRequired(input: ProductUpsertInput) {
        return ProductsService.isBag(input) || ProductsService.isRoll(input);
    }
}
