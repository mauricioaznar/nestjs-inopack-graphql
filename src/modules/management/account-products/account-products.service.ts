import { BadRequestException, Injectable } from '@nestjs/common';
import {
    Account,
    AccountProduct,
    AccountProductsUpsertInput,
    Product,
} from '../../../common/dto/entities';
import {
    getCreatedAtProperty,
    getUpdatedAtProperty,
    vennDiagram,
} from '../../../common/helpers';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class AccountProductsService {
    constructor(private prisma: PrismaService) {}

    async getAccountProducts({
        account_id,
    }: {
        account_id: number;
    }): Promise<AccountProduct[]> {
        if (!account_id) return [];

        return this.prisma.account_products.findMany({
            where: {
                account_id: account_id,
                active: 1,
            },
        });
    }

    async getAccount({
        account_id,
    }: {
        account_id?: number | null;
    }): Promise<Account | null> {
        if (!account_id) return null;

        return this.prisma.accounts.findFirst({
            where: { id: account_id },
        });
    }

    async getProduct({
        product_id,
    }: {
        product_id?: number | null;
    }): Promise<Product | null> {
        if (!product_id) return null;

        return this.prisma.products.findFirst({
            where: { id: product_id },
        });
    }

    async upsertAccountProducts({
        input,
    }: {
        input: AccountProductsUpsertInput;
    }): Promise<AccountProduct[]> {
        await this.validateAccountProducts(input);

        const newItems = input.account_products;
        const oldItems = await this.prisma.account_products.findMany({
            where: {
                account_id: input.account_id,
                active: 1,
            },
        });

        const {
            aMinusB: deleteItems,
            bMinusA: createItems,
            intersection: updateItems,
        } = vennDiagram({
            a: oldItems,
            b: newItems,
            indexProperties: ['id'],
        });

        for await (const delItem of deleteItems) {
            if (delItem && delItem.id) {
                await this.prisma.account_products.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        active: -1,
                    },
                    where: { id: delItem.id },
                });
            }
        }

        for await (const createItem of createItems) {
            // group_weight is derived from the product, not user-typed, so the
            // catalog stays consistent with the order-request weight checks.
            const groupWeight = await this.getProductGroupWeight({
                product_id: createItem.product_id,
            });
            await this.prisma.account_products.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    account_id: input.account_id,
                    product_id: createItem.product_id,
                    kilo_price: createItem.kilo_price,
                    group_price: createItem.group_price,
                    group_weight: groupWeight,
                    active: 1,
                },
            });
        }

        for await (const updateItem of updateItems) {
            if (updateItem && updateItem.id) {
                const groupWeight = await this.getProductGroupWeight({
                    product_id: updateItem.product_id,
                });
                await this.prisma.account_products.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        product_id: updateItem.product_id,
                        kilo_price: updateItem.kilo_price,
                        group_price: updateItem.group_price,
                        group_weight: groupWeight,
                        active: 1,
                    },
                    where: { id: updateItem.id },
                });
            }
        }

        return this.getAccountProducts({ account_id: input.account_id });
    }

    private async getProductGroupWeight({
        product_id,
    }: {
        product_id?: number | null;
    }): Promise<number> {
        if (!product_id) return 0;
        const product = await this.prisma.products.findUnique({
            where: { id: product_id },
        });
        return product?.current_group_weight || 0;
    }

    async validateAccountProducts(
        input: AccountProductsUpsertInput,
    ): Promise<void> {
        const errors: string[] = [];

        // IsAccountClient
        {
            const account = await this.prisma.accounts.findFirst({
                where: { id: input.account_id },
            });

            if (!account || !account.is_client) {
                errors.push('Account is not a client');
            }
        }

        // AreProductsUnique — a product cannot be repeated in the account catalog
        {
            input.account_products.forEach(({ product_id: product_id_1 }) => {
                let count = 0;
                input.account_products.forEach(({ product_id: product_id_2 }) => {
                    if (product_id_1 === product_id_2) {
                        count = count + 1;
                    }
                });
                if (count >= 2) {
                    errors.push(
                        `product is not unique (product_id: ${product_id_1})`,
                    );
                }
            });
        }

        // ProductsExist
        {
            for await (const { product_id } of input.account_products) {
                if (!product_id) {
                    errors.push('product is required');
                    continue;
                }
                const product = await this.prisma.products.findFirst({
                    where: { id: product_id, active: 1 },
                });
                if (!product) {
                    errors.push(`product (${product_id}) does not exist`);
                }
            }
        }

        // One of kilo price and group price has to be different than 0,
        // and never both at the same time.
        {
            input.account_products.forEach((accountProduct, index) => {
                if (
                    accountProduct.group_price !== 0 &&
                    accountProduct.kilo_price !== 0
                ) {
                    errors.push(
                        `Only one of kilo price and group price can be different than 0 (index: ${index}, product id: ${accountProduct.product_id})`,
                    );
                }
                if (
                    accountProduct.group_price === 0 &&
                    accountProduct.kilo_price === 0
                ) {
                    errors.push(
                        `One of kilo price and group price has to be different than 0 (index: ${index}, product id: ${accountProduct.product_id})`,
                    );
                }
            });
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }
}
