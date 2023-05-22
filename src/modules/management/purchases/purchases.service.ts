import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    PaginatedPurchases,
    Purchase,
    PurchasesQueryArgs,
    PurchasesSortArgs,
    PurchaseUpsertInput,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import {
    getCreatedAtProperty,
    getRangesFromYearMonth,
    getUpdatedAtProperty,
    vennDiagram,
} from '../../../common/helpers';
import { Prisma } from '@prisma/client';
import { PurchaseItem } from '../../../common/dto/entities/management/purchase-item.dto';

@Injectable()
export class PurchasesService {
    constructor(private prisma: PrismaService) {}

    async getPurchase({
        purchase_id,
    }: {
        purchase_id: number;
    }): Promise<Purchase | null> {
        return this.prisma.purchases.findFirst({
            where: {
                id: purchase_id,
                active: 1,
            },
        });
    }

    async getPurchases(): Promise<Purchase[]> {
        return this.prisma.purchases.findMany({
            where: {
                active: 1,
            },
        });
    }

    async getPurchaseItems({
        purchase_id,
    }: {
        purchase_id: number | null;
    }): Promise<PurchaseItem[]> {
        if (!purchase_id) {
            return [];
        }

        return this.prisma.purchase_items.findMany({
            where: {
                AND: [
                    {
                        purchase_id: purchase_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async upsertPurchase(input: PurchaseUpsertInput): Promise<Purchase> {
        await this.validateUpsertPurchase(input);

        const purchase = await this.prisma.purchases.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                date: input.date,
                locked: input.locked,
            },
            update: {
                ...getUpdatedAtProperty(),
                date: input.date,
                locked: input.locked,
            },
            where: {
                id: input.id || 0,
            },
        });

        const newPurchaseItems = input.purchase_items;
        const oldPurchaseItems = input.id
            ? await this.prisma.purchase_items.findMany({
                  where: {
                      purchase_id: input.id,
                  },
              })
            : [];

        const {
            aMinusB: deletePurchaseItems,
            bMinusA: createPurchaseItems,
            intersection: updatePurchaseItems,
        } = vennDiagram({
            a: oldPurchaseItems,
            b: newPurchaseItems,
            indexProperties: ['id'],
        });

        for await (const delItem of deletePurchaseItems) {
            if (delItem && delItem.id) {
                await this.prisma.purchase_items.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        active: -1,
                    },
                    where: {
                        id: delItem.id,
                    },
                });
                // await this.cacheManager.del(`product_inventory`);
            }
        }

        for await (const createItem of createPurchaseItems) {
            await this.prisma.purchase_items.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    amount: createItem.amount ? createItem.amount : 0,
                    purchase_id: purchase.id,
                },
            });
            // await this.cacheManager.del(`product_inventory`);
        }

        for await (const updateItem of updatePurchaseItems) {
            if (updateItem && updateItem.id) {
                await this.prisma.purchase_items.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        amount: updateItem.amount ? updateItem.amount : 0,
                        purchase_id: purchase.id,
                    },
                    where: {
                        id: updateItem.id,
                    },
                });
            }
        }

        return purchase;
    }

    async paginatedPurchases({
        offsetPaginatorArgs,
        datePaginator,
        purchasesQueryArgs,
        purchasesSortArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: YearMonth;
        purchasesQueryArgs: PurchasesQueryArgs;
        purchasesSortArgs: PurchasesSortArgs;
    }): Promise<PaginatedPurchases> {
        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
        });

        const { sort_order, sort_field } = purchasesSortArgs;

        const filter =
            purchasesQueryArgs.filter !== '' && !!purchasesQueryArgs.filter
                ? purchasesQueryArgs.filter
                : undefined;

        const isFilterANumber = !Number.isNaN(Number(filter));

        const purchasesWhere: Prisma.purchasesWhereInput = {
            AND: [
                {
                    active: 1,
                },
            ],
        };
        let orderBy: Prisma.purchasesOrderByWithRelationInput = {
            updated_at: 'desc',
        };

        if (sort_order && sort_field) {
            if (sort_field === 'date') {
                orderBy = {
                    date: sort_order,
                };
            }
        }

        const purchasesCount = await this.prisma.purchases.count({
            where: purchasesWhere,
        });

        const purchases = await this.prisma.purchases.findMany({
            where: purchasesWhere,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: orderBy,
        });

        return {
            count: purchasesCount,
            docs: purchases,
        };
    }

    async validateUpsertPurchase(
        purchaseUpsertInput: PurchaseUpsertInput,
    ): Promise<void> {
        const errors: string[] = [];

        // order production type cant change

        if (purchaseUpsertInput.id) {
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async deletePurchase({
        purchase_id,
    }: {
        purchase_id: number;
    }): Promise<boolean> {
        const purchase = await this.getPurchase({ purchase_id: purchase_id });

        if (!purchase_id) {
            throw new NotFoundException();
        }

        await this.prisma.purchases.update({
            data: {
                active: -1,
            },
            where: {
                id: purchase_id,
            },
        });

        await this.prisma.purchase_items.updateMany({
            data: {
                active: -1,
            },
            where: {
                purchase_id: purchase_id,
            },
        });

        return true;
    }

    async isDeletable({
        purchase_id,
    }: {
        purchase_id: number;
    }): Promise<boolean> {
        return true;
    }

    async isEditable({
        purchase_id,
    }: {
        purchase_id: number;
    }): Promise<boolean> {
        return true;
    }
}
