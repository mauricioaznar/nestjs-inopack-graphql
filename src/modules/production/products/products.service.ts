import { BadRequestException, Injectable } from '@nestjs/common';
import {
    GetProductsQueryFields,
    PaginatedProducts,
    PaginatedProductsQueryArgs,
    PaginatedProductsSortArgs,
    Product,
    ProductUpsertInput,
} from '../../../common/dto/entities';
import { isEmpty } from 'class-validator';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { ProductCategory } from '../../../common/dto/entities/production/product-category.dto';
import { ProductMaterial } from '../../../common/dto/entities/production/product-material.dto';
import {
    getCreatedAtProperty,
    getUpdatedAtProperty,
} from '../../../common/helpers';
import { OffsetPaginatorArgs } from '../../../common/dto/pagination';
import { Prisma } from '@prisma/client';
import { OrderProductionProduct } from '../../../common/dto/entities/production/order-production-product.dto';

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

    async getOrderProductionProducts({
        product_id,
    }: {
        product_id: number | null;
    }): Promise<OrderProductionProduct[]> {
        if (!product_id) return [];

        return this.prisma.order_production_products.findMany({
            where: {
                AND: [
                    {
                        product_id: product_id,
                    },
                    {
                        active: 1,
                    },
                    {
                        order_productions: {
                            active: 1,
                        },
                    },
                ],
            },
        });
    }

    async getProducts(args?: {
        getProductsQueryFields?: GetProductsQueryFields;
    }): Promise<Product[]> {
        const getProductsQueryFields = args?.getProductsQueryFields;
        const excludeDiscontinued =
            getProductsQueryFields?.exclude_discontinued;

        return this.prisma.products.findMany({
            where: {
                AND: [
                    {
                        active: 1,
                    },
                    {
                        discontinued: excludeDiscontinued ? false : undefined,
                    },
                ],
            },
            orderBy: [
                {
                    order_production_type_id: 'asc',
                },
                {
                    description: 'asc',
                },
            ],
        });
    }

    async paginatedProducts({
        offsetPaginatorArgs,
        productsQueryArgs,
        productsSortArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        productsQueryArgs: PaginatedProductsQueryArgs;
        productsSortArgs: PaginatedProductsSortArgs;
    }): Promise<PaginatedProducts> {
        const filter =
            productsQueryArgs.filter !== ''
                ? productsQueryArgs.filter
                : undefined;

        const { sort_order, sort_field } = productsSortArgs;

        const where: Prisma.productsWhereInput = {
            AND: [
                {
                    active: 1,
                },
                {
                    product_category_id:
                        productsQueryArgs.product_category_id || undefined,
                },
                {
                    discontinued: !productsQueryArgs.include_discontinued
                        ? false
                        : undefined,
                },
                {
                    OR: [
                        {
                            external_description: {
                                contains: filter,
                            },
                        },
                        {
                            internal_description: {
                                contains: filter,
                            },
                        },
                    ],
                },
            ],
        };

        let orderBy: Prisma.productsOrderByWithRelationInput = {
            updated_at: 'desc',
        };

        if (sort_order && sort_field) {
            if (sort_field === 'external_description') {
                orderBy = {
                    external_description: sort_order,
                };
            } else if (sort_field === 'internal_description') {
                orderBy = {
                    internal_description: sort_order,
                };
            } else if (sort_field === 'order_production_type_id') {
                orderBy = {
                    order_production_type_id: sort_order,
                };
            } else if (sort_field === 'product_category_id') {
                orderBy = {
                    product_category_id: sort_order,
                };
            }
        }

        const count = await this.prisma.products.count({
            where: where,
        });
        const products = await this.prisma.products.findMany({
            where: where,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: orderBy,
        });

        return {
            count: count || 0,
            docs: products || [],
        };
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
                discontinued: input.discontinued,
                internal_description: input.internal_description,
                external_description: input.external_description,
                code: input.code,
                current_group_weight: input.current_group_weight,
                current_kilo_price: input.current_kilo_price,
                description: input.external_description,
                width: input.width,
                length: input.length,
                order_production_type_id: input.order_production_type_id,
                product_category_id: input.product_category_id,
                product_material_id: input.product_material_id,
            },
            update: {
                ...getUpdatedAtProperty(),
                calibre: input.calibre,
                code: input.code,
                discontinued: input.discontinued,
                internal_description: input.internal_description,
                external_description: input.external_description,
                current_group_weight: input.current_group_weight,
                current_kilo_price: input.current_kilo_price,
                width: input.width,
                length: input.length,
                description: input.external_description,
                order_production_type_id: input.order_production_type_id,
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

        // product category
        // DoesProductCategoryBelongToOrderProductionType
        if (input.product_category_id) {
            const productCategory =
                await this.prisma.product_categories.findUnique({
                    where: {
                        id: input.product_category_id,
                    },
                });
            if (!productCategory) {
                errors.push('Product type not found');
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

        const previousProduct = await this.prisma.products.findUnique({
            where: {
                id: input.id || 0,
            },
        });

        if (!!previousProduct) {
            if (
                previousProduct.product_category_id !==
                input.product_category_id
            ) {
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
