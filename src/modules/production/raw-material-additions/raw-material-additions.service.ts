import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    getCreatedAtProperty,
    getUpdatedAtProperty,
    vennDiagram,
} from '../../../common/helpers';
import { OffsetPaginatorArgs } from '../../../common/dto/pagination';
import { Prisma } from '@prisma/client';
import {
    Account,
    Branch,
    PaginatedRawMaterialAdditions,
    PaginatedRawMaterialAdditionsQueryArgs,
    PaginatedRawMaterialAdditionsSortArgs,
    RawMaterialAddition,
    RawMaterialAdditionItem,
    RawMaterialAdditionUpsertInput,
} from '../../../common/dto/entities';
import { OrderProductionProduct } from '../../../common/dto/entities/production/order-production-product.dto';

@Injectable()
export class RawMaterialAdditionsService {
    constructor(private prisma: PrismaService) {}

    async getRawMaterialAdditions(): Promise<RawMaterialAddition[]> {
        return this.prisma.raw_material_additions.findMany({
            where: {
                active: 1,
            },
        });
    }

    async paginatedRawMaterialAdditions({
        offsetPaginatorArgs,
        paginatedRawMaterialAdditionsQueryArgs,
        paginatedRawMaterialAdditionsSortArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        paginatedRawMaterialAdditionsQueryArgs: PaginatedRawMaterialAdditionsQueryArgs;
        paginatedRawMaterialAdditionsSortArgs: PaginatedRawMaterialAdditionsSortArgs;
    }): Promise<PaginatedRawMaterialAdditions> {
        const filter =
            paginatedRawMaterialAdditionsQueryArgs.filter !== ''
                ? paginatedRawMaterialAdditionsQueryArgs.filter
                : undefined;

        const { sort_order, sort_field } =
            paginatedRawMaterialAdditionsSortArgs;

        const where: Prisma.raw_material_additionsWhereInput = {
            AND: [
                {
                    active: 1,
                },
            ],
        };

        const orderBy: Prisma.raw_material_additionsOrderByWithRelationInput = {
            updated_at: 'desc',
        };

        if (sort_order && sort_field) {
        }

        const count = await this.prisma.raw_material_additions.count({
            where: where,
        });
        const rawMaterialAdditions =
            await this.prisma.raw_material_additions.findMany({
                where: where,
                take: offsetPaginatorArgs.take,
                skip: offsetPaginatorArgs.skip,
                orderBy: orderBy,
            });

        return {
            count: count || 0,
            docs: rawMaterialAdditions || [],
        };
    }

    async getRawMaterialAddition({
        rawMaterialAdditionId,
    }: {
        rawMaterialAdditionId: number;
    }): Promise<RawMaterialAddition | null> {
        if (!rawMaterialAdditionId) return null;

        return this.prisma.raw_material_additions.findFirst({
            where: {
                id: rawMaterialAdditionId,
                active: 1,
            },
        });
    }

    async upsertRawMaterialAddition(
        input: RawMaterialAdditionUpsertInput,
    ): Promise<RawMaterialAddition> {
        await this.validateRawMaterialAdditionUpsert(input);

        const rawMaterialAddition =
            await this.prisma.raw_material_additions.upsert({
                create: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    date: input.date,
                    account_id: input.account_id,
                },
                update: {
                    ...getUpdatedAtProperty(),
                    date: input.date,
                    account_id: input.account_id,
                },
                where: {
                    id: input.id || 0,
                },
            });

        const newItems = input.raw_material_addition_items;
        const oldItems = input.id
            ? await this.prisma.raw_material_addition_items.findMany({
                  where: {
                      raw_material_addition_id: input.id,
                  },
              })
            : [];

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
            await this.prisma.raw_material_addition_items.updateMany({
                data: {
                    ...getUpdatedAtProperty(),
                    active: -1,
                },
                where: {
                    raw_material_addition_id: delItem.id,
                },
            });
            // await this.cacheManager.del(`product_inventory`);
        }

        for await (const createItem of createItems) {
            await this.prisma.raw_material_addition_items.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    raw_material_addition_id: rawMaterialAddition.id,
                    amount: createItem.amount,
                    unit_price: createItem.unit_price,
                    resource_id: createItem.resource_id,
                },
            });
            // await this.cacheManager.del(`product_inventory`);
        }

        for await (const updateItem of updateItems) {
            await this.prisma.raw_material_addition_items.updateMany({
                data: {
                    ...getUpdatedAtProperty(),
                    raw_material_addition_id: rawMaterialAddition.id,
                    amount: updateItem.amount,
                    unit_price: updateItem.unit_price,
                    resource_id: updateItem.resource_id,
                },
                where: {
                    id: updateItem.id!,
                },
            });
            // await this.cacheManager.del(`product_inventory`);
        }
        return rawMaterialAddition;
    }

    async getRawMaterialAdditionItems({
        raw_material_addition_id,
    }: {
        raw_material_addition_id: number;
    }): Promise<RawMaterialAdditionItem[]> {
        return this.prisma.raw_material_addition_items.findMany({
            where: {
                AND: [
                    {
                        raw_material_addition_id: raw_material_addition_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async validateRawMaterialAdditionUpsert(
        input: RawMaterialAdditionUpsertInput,
    ): Promise<void> {
        const errors: string[] = [];

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async deletesRawMaterialAddition({
        rawMaterialAddition_id,
    }: {
        rawMaterialAddition_id: number;
    }): Promise<boolean> {
        const rawMaterialAddition = await this.getRawMaterialAddition({
            rawMaterialAdditionId: rawMaterialAddition_id,
        });

        if (!rawMaterialAddition) {
            throw new NotFoundException();
        }

        const isDeletable = await this.isDeletable({
            rawMaterialAddition_id,
        });

        if (!isDeletable) {
            const errors: string[] = [];

            throw new BadRequestException(errors);
        }

        await this.prisma.raw_material_additions.update({
            data: {
                ...getUpdatedAtProperty(),
                active: -1,
            },
            where: {
                id: rawMaterialAddition_id,
            },
        });

        return true;
    }

    async getAccount({
        account_id,
    }: {
        account_id: number | null;
    }): Promise<Account | null> {
        if (!account_id) {
            return null;
        }

        return this.prisma.accounts.findFirst({
            where: {
                id: account_id,
                active: 1,
            },
        });
    }

    async getTotal({
        raw_material_addition_id,
    }: {
        raw_material_addition_id: number | null;
    }): Promise<number> {
        if (!raw_material_addition_id) {
            return 0;
        }

        const rawMaterialAdditionItems =
            await this.prisma.raw_material_addition_items.findMany({
                where: {
                    raw_material_addition_id: raw_material_addition_id,
                },
            });

        return rawMaterialAdditionItems.reduce(
            (acc, rawMaterialAdditionItem) => {
                return (
                    acc +
                    rawMaterialAdditionItem.amount *
                        rawMaterialAdditionItem.unit_price
                );
            },
            0,
        );
    }

    async isDeletable({
        rawMaterialAddition_id,
    }: {
        rawMaterialAddition_id: number;
    }): Promise<boolean> {
        return true;
    }
}
