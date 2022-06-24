import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ProductInventory } from '../../../common/dto/entities/production/product-inventory.dto';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { Product } from '../../../common/dto/entities';

@Injectable()
export class ProductInventoryService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getProductsInventory(): Promise<ProductInventory[]> {
        const cachedProductInventory: ProductInventory[] | undefined =
            await this.cacheManager.get(`product_inventory`);

        if (!!cachedProductInventory) return cachedProductInventory;

        const results = await this.prisma.$queryRaw<ProductInventory[]>`
            SELECT 
                *,
                IF (
                   cte.last_update != '0001-01-01 00:00:00',
                   DATE_FORMAT(cte.last_update, '%Y-%m-%dT%TZ'),
                   null
                ) as last_update
            FROM (
                SELECT
                        products.id as product_id,
                        sale_products.kilos             as kilos_sold_given,
                        adjustment_products.kilos       as kilos_adjusted,
                        production_products.kilos       as kilos_produced,
                            (
                                COALESCE(adjustment_products.kilos, 0)
                                + COALESCE(production_products.kilos, 0)
                                - COALESCE(sale_products.kilos, 0)
                            )                           as \`kilos\`,
                        sale_products.\`groups\`        as groups_sold_given,
                        adjustment_products.\`groups\`  as groups_adjusted,
                        production_products.\`groups\`  as groups_produced,
                            (
                                COALESCE(adjustment_products.\`groups\`, 0)
                                + COALESCE(production_products.\`groups\`, 0)
                                - COALESCE(sale_products.\`groups\`, 0)
                            )                           as \`groups\`,
                         GREATEST
                            (
                                COALESCE(sale_products.last_update, '0001-01-01 00:00:00'),
                                COALESCE(adjustment_products.last_update, '0001-01-01 00:00:00'),
                                COALESCE(production_products.last_update, '0001-01-01 00:00:00')
                            )                            as last_update,
                        sale_products.last_update       as sales_last_update,
                        adjustment_products.last_update as adjustments_last_update,
                        production_products.last_update as production_last_update
                FROM products
                LEFT JOIN ( 
                                     SELECT SUM(order_sale_products.kilos)      as kilos,
                                     SUM(order_sale_products.\`groups\`) as \`groups\`,
                                     order_sale_products.product_id      as product_id,
                                     MAX(order_sale_products.updated_at) as last_update
                                     FROM order_sale_products
                                     JOIN order_sales
                                     ON order_sales.id = order_sale_products.order_sale_id
                                     WHERE order_sales.active = 1
                                        AND order_sales.order_sale_status_id = 2
                                        AND order_sale_products.active = 1
                                     GROUP BY product_id
                    ) as sale_products
                ON sale_products.product_id = products.id
                LEFT JOIN (         
                                     SELECT SUM(order_adjustment_products.kilos)      as kilos,
                                     SUM(order_adjustment_products.\`groups\`) as \`groups\`,
                                     order_adjustment_products.product_id      as product_id,
                                     MAX(order_adjustment_products.updated_at) as last_update
                                     FROM order_adjustment_products
                                     JOIN order_adjustments
                                     ON order_adjustments.id = order_adjustment_products.order_adjustment_id
                                     WHERE order_adjustments.active = 1
                                        AND order_adjustment_products.active = 1
                                     GROUP BY product_id
                    ) as adjustment_products
                ON adjustment_products.product_id = products.id
                LEFT JOIN (
                                     SELECT SUM(order_production_products.kilos)      as kilos,
                                     SUM(order_production_products.\`groups\`) as \`groups\`,
                                     order_production_products.product_id      as product_id,
                                     MAX(order_production_products.updated_at) as last_update
                                     FROM order_production_products
                                     JOIN order_productions
                                     ON order_productions.id = order_production_products.order_production_id
                                     WHERE order_productions.active = 1
                                        AND order_production_products.active = 1
                                     GROUP BY product_id
                    ) as production_products
                ON production_products.product_id = products.id
                JOIN product_type 
                ON product_type.id = products.product_type_id
                WHERE products.active = 1
                ORDER BY last_update DESC
            ) as cte;
        `;

        await this.cacheManager.set(`product_inventory`, results);
        return results;
    }

    async getProduct({
        product_id,
    }: {
        product_id: number;
    }): Promise<Product | null> {
        return this.prisma.products.findFirst({
            where: {
                id: product_id,
            },
        });
    }
}
