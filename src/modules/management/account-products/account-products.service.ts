import { Injectable } from '@nestjs/common';
import { AccountProduct, Product } from '../../../common/dto/entities';
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
}
