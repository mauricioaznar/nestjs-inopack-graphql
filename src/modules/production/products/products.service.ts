import { BadRequestException, Injectable } from '@nestjs/common';
import { Product, ProductUpsertInput } from '../../../common/dto/entities';
import { isEmpty } from 'class-validator';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { ProductType } from '../../../common/dto/entities/production/product-type.dto';
import { ProductCategory } from '../../../common/dto/entities/production/product-category.dto';
import { ProductMaterial } from '../../../common/dto/entities/production/product-material.dto';
import {
    getCreatedAtProperty,
    getUpdatedAtProperty,
} from '../../../common/helpers';

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
                AND: [
                    {
                        id: product_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async getProducts(): Promise<Product[]> {
        return this.prisma.products.findMany({
            where: {
                active: 1,
            },
            orderBy: {
                description: 'asc',
            },
        });
    }

    async getProductType({
        product_type_id,
    }: {
        product_type_id: number | null;
    }): Promise<ProductType | null> {
        if (!product_type_id) return null;

        return this.prisma.product_type.findFirst({
            where: {
                id: product_type_id,
            },
        });
    }

    async getProductCategory({
        product_category_id,
    }: {
        product_category_id: number | null;
    }): Promise<ProductCategory | null> {
        if (!product_category_id) return null;

        return this.prisma.product_categories.findFirst({
            where: {
                id: product_category_id,
            },
        });
    }

    async getProductMaterial({
        product_material_id,
    }: {
        product_material_id: number | null;
    }): Promise<ProductMaterial | null> {
        if (!product_material_id) return null;

        return this.prisma.product_materials.findFirst({
            where: {
                id: product_material_id,
            },
        });
    }

    async getOrderProductionType({
        order_production_type_id,
    }: {
        order_production_type_id: number | null;
    }): Promise<ProductMaterial | null> {
        if (!order_production_type_id) return null;

        return this.prisma.order_production_type.findFirst({
            where: {
                id: order_production_type_id,
            },
        });
    }

    // update or insert
    async upsertInput(input: ProductUpsertInput): Promise<Product> {
        await this.validateAndCleanUpsertInput(input);

        return this.prisma.products.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
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
                product_category_id: input.product_category_id,
                product_material_id: input.product_material_id,
            },
            update: {
                ...getUpdatedAtProperty(),
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
                product_category_id: input.product_category_id,
                product_material_id: input.product_material_id,
            },
            where: {
                id: input.id || 0,
            },
        });
    }

    private async validateAndCleanUpsertInput(
        input: ProductUpsertInput,
    ): Promise<void> {
        const errors: string[] = [];

        // width
        if (ProductsService.isWidthRequired(input)) {
            if (isEmpty(input.width)) {
                errors.push('Width is required');
            }
        } else {
            input.width = 0;
        }

        // length
        if (ProductsService.isLengthRequired(input)) {
            if (isEmpty(input.length)) {
                errors.push('Length is required');
            }
        } else {
            input.length = null;
        }

        // current group weight
        if (ProductsService.isCurrentGroupWeightRequired(input)) {
            if (isEmpty(input.current_group_weight)) {
                errors.push('Current group weight is required');
            }
        } else {
            input.current_group_weight = 0;
        }

        // calibre
        if (ProductsService.isCalibreRequired(input)) {
            if (isEmpty(input.calibre)) {
                errors.push('Calibre is required');
            }
        } else {
            input.calibre = 0;
        }

        // packing
        if (ProductsService.isPackingIdRequired(input)) {
            if (isEmpty(input.packing_id)) {
                errors.push('Packing is required');
            }
        } else {
            input.packing_id = null;
        }

        // product type
        // DoesProductTypeBelongToOrderProductionType
        if (input.product_type_id) {
            const productType = await this.prisma.product_type.findUnique({
                where: {
                    id: input.product_type_id,
                },
            });
            if (!productType) {
                errors.push('Product type not found');
            }
            if (
                productType &&
                productType.order_production_type_id !==
                    input.order_production_type_id
            ) {
                errors.push(
                    'Product type doesnt belong to order production type',
                );
            }
        }

        const previousProduct = await this.prisma.products.findUnique({
            where: {
                id: input.id || 0,
            },
        });

        if (!!previousProduct) {
            if (previousProduct.product_type_id !== input.product_type_id) {
                errors.push('Product type cant be changed');
            }

            if (
                previousProduct.order_production_type_id !==
                input.order_production_type_id
            ) {
                errors.push('Order production type cant be changed');
            }
        }

        // product type
        // DoesProductTypeBelongToOrderProductionType
        if (input.product_category_id) {
            const productCategory =
                await this.prisma.product_categories.findUnique({
                    where: {
                        id: input.product_category_id,
                    },
                });
            if (!productCategory) {
                errors.push('Product category not found');
            }
            if (
                productCategory &&
                productCategory.order_production_type_id !==
                    input.order_production_type_id
            ) {
                errors.push(
                    'Product category doesnt belong to order production type',
                );
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    private static isBag(input: ProductUpsertInput) {
        return input.order_production_type_id === 1;
    }

    private static isRoll(input: ProductUpsertInput) {
        return input.order_production_type_id === 2;
    }

    private static isPellet(input: ProductUpsertInput) {
        return input.order_production_type_id === 3;
    }

    private static isOthers(input: ProductUpsertInput) {
        return input.order_production_type_id === null;
    }

    private static isWidthRequired(input: ProductUpsertInput) {
        return (
            ProductsService.isBag(input) ||
            ProductsService.isRoll(input) ||
            ProductsService.isOthers(input)
        );
    }

    private static isLengthRequired(input: ProductUpsertInput) {
        return ProductsService.isBag(input) || ProductsService.isOthers(input);
    }

    private static isCurrentGroupWeightRequired(input: ProductUpsertInput) {
        return ProductsService.isBag(input) || ProductsService.isOthers(input);
    }

    private static isCalibreRequired(input: ProductUpsertInput) {
        return (
            ProductsService.isBag(input) ||
            ProductsService.isRoll(input) ||
            ProductsService.isOthers(input)
        );
    }

    private static isPackingIdRequired(input: ProductUpsertInput) {
        return ProductsService.isBag(input);
    }

    async deleteProduct({ product_id }: { product_id: number }): Promise<void> {
        const product = await this.prisma.products.findUnique({
            where: {
                id: product_id,
            },
            rejectOnNotFound: false,
        });

        if (!product) {
            throw new BadRequestException(['Product not found']);
        }

        const isDeletable = await this.isDeletable({
            product_id,
        });

        if (!isDeletable) {
            const errors: string[] = [];

            const {
                order_requests_count,
                order_productions_count,
                order_adjustments_count,
                order_sales_count,
            } = await this.getDependenciesCount({
                product_id,
            });

            if (order_requests_count > 0) {
                errors.push(`order requests count ${order_requests_count}`);
            }

            if (order_adjustments_count > 0) {
                errors.push(
                    `order adjustments count ${order_adjustments_count}`,
                );
            }

            if (order_productions_count > 0) {
                errors.push(
                    `order productions count ${order_productions_count}`,
                );
            }

            if (order_sales_count > 0) {
                errors.push(`order sales count ${order_sales_count}`);
            }

            throw new BadRequestException(errors);
        }

        await this.prisma.products.update({
            data: {
                ...getUpdatedAtProperty(),
                active: -1,
            },
            where: {
                id: product.id,
            },
        });
    }

    async getDependenciesCount({
        product_id,
    }: {
        product_id: number;
    }): Promise<{
        order_requests_count: number;
        order_adjustments_count: number;
        order_productions_count: number;
        order_sales_count: number;
    }> {
        const {
            _count: { id: orderRequestsCount },
        } = await this.prisma.order_requests.aggregate({
            _count: {
                id: true,
            },
            where: {
                AND: [
                    {
                        active: 1,
                    },
                    {
                        order_request_products: {
                            some: {
                                AND: [
                                    {
                                        product_id: product_id,
                                    },
                                    {
                                        active: 1,
                                    },
                                ],
                            },
                        },
                    },
                ],
            },
        });

        const {
            _count: { id: orderAdjustmentsCount },
        } = await this.prisma.order_adjustments.aggregate({
            _count: {
                id: true,
            },
            where: {
                AND: [
                    {
                        active: 1,
                    },
                    {
                        order_adjustment_products: {
                            some: {
                                AND: [
                                    {
                                        product_id: product_id,
                                    },
                                    {
                                        active: 1,
                                    },
                                ],
                            },
                        },
                    },
                ],
            },
        });

        const {
            _count: { id: orderProductionsCount },
        } = await this.prisma.order_productions.aggregate({
            _count: {
                id: true,
            },
            where: {
                AND: [
                    {
                        active: 1,
                    },
                    {
                        order_production_products: {
                            some: {
                                AND: [
                                    {
                                        product_id: product_id,
                                    },
                                    {
                                        active: 1,
                                    },
                                ],
                            },
                        },
                    },
                ],
            },
        });

        const {
            _count: { id: orderSalesCount },
        } = await this.prisma.order_sales.aggregate({
            _count: {
                id: true,
            },
            where: {
                AND: [
                    {
                        active: 1,
                    },
                    {
                        order_sale_products: {
                            some: {
                                AND: [
                                    {
                                        product_id: product_id,
                                    },
                                    {
                                        active: 1,
                                    },
                                ],
                            },
                        },
                    },
                ],
            },
        });

        return {
            order_requests_count: orderRequestsCount,
            order_adjustments_count: orderAdjustmentsCount,
            order_productions_count: orderProductionsCount,
            order_sales_count: orderSalesCount,
        };
    }

    async isDeletable({
        product_id,
    }: {
        product_id: number;
    }): Promise<boolean> {
        const {
            order_requests_count,
            order_productions_count,
            order_adjustments_count,
            order_sales_count,
        } = await this.getDependenciesCount({
            product_id,
        });

        return (
            order_requests_count === 0 &&
            order_productions_count === 0 &&
            order_adjustments_count === 0 &&
            order_sales_count === 0
        );
    }
}
