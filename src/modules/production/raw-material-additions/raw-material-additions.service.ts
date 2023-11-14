import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    formatDate,
    formatFloat,
    getCreatedAtProperty,
    getRangesFromYearMonth,
    getUpdatedAtProperty,
    vennDiagram,
} from '../../../common/helpers';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { Prisma } from '@prisma/client';
import {
    Account,
    Branch,
    Expense,
    GetRawMaterialAdditionsQueryArgs,
    PaginatedRawMaterialAdditions,
    PaginatedRawMaterialAdditionsQueryArgs,
    PaginatedRawMaterialAdditionsSortArgs,
    RawMaterialAddition,
    RawMaterialAdditionItem,
    RawMaterialAdditionUpsertInput,
} from '../../../common/dto/entities';
import { OrderProductionProduct } from '../../../common/dto/entities/production/order-production-product.dto';
import dayjs from 'dayjs';

@Injectable()
export class RawMaterialAdditionsService {
    constructor(private prisma: PrismaService) {}

    async getRawMaterialAdditions({
        getRawMaterialAdditionsQueryArgs,
    }: {
        getRawMaterialAdditionsQueryArgs: GetRawMaterialAdditionsQueryArgs;
    }): Promise<RawMaterialAddition[]> {
        return this.prisma.raw_material_additions.findMany({
            where: {
                active: 1,
                account_id:
                    getRawMaterialAdditionsQueryArgs.account_id || undefined,
            },
        });
    }

    async getRawMaterialAdditionsWithDisparities(): Promise<
        RawMaterialAddition[]
    > {
        const res = await this.prisma.$queryRawUnsafe<RawMaterialAddition[]>(`
           SELECT
                raw_material_additions.*,
                wtv.total,
                ztv.total
           FROM raw_material_additions
           JOIN
                (
                        SELECT
                            expense_raw_material_additions.raw_material_addition_id as raw_material_addition_id,
                            round(sum(expense_raw_material_additions.amount)) total
                        FROM expense_raw_material_additions
                        WHERE expense_raw_material_additions.active = 1
                        GROUP BY expense_raw_material_additions.raw_material_addition_id
                ) AS wtv
            on wtv.raw_material_addition_id = raw_material_additions.id
            left JOIN   
                (
                        SELECT
                            raw_material_addition_items.raw_material_addition_id as raw_material_addition_id,
                            round(sum(raw_material_addition_items.amount * raw_material_addition_items.unit_price)) total
                        FROM raw_material_addition_items
                        WHERE raw_material_addition_items.active = 1
                        GROUP BY raw_material_addition_items.raw_material_addition_id
                ) AS ztv
            on ztv.raw_material_addition_id = raw_material_additions.id
            where ((ztv.total - wtv.total) != 0  or isnull(ztv.total))
            order by case when date is null then 1 else 0 end, date
        `);

        return res.map((ex) => {
            console.log(ex);
            return {
                ...ex,
                date: ex.date ? new Date(ex.date) : null,
            };
        });
    }

    async paginatedRawMaterialAdditions({
        offsetPaginatorArgs,
        paginatedRawMaterialAdditionsQueryArgs,
        paginatedRawMaterialAdditionsSortArgs,
        datePaginator,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: YearMonth;
        paginatedRawMaterialAdditionsQueryArgs: PaginatedRawMaterialAdditionsQueryArgs;
        paginatedRawMaterialAdditionsSortArgs: PaginatedRawMaterialAdditionsSortArgs;
    }): Promise<PaginatedRawMaterialAdditions> {
        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
        });

        const filter =
            paginatedRawMaterialAdditionsQueryArgs.filter !== ''
                ? paginatedRawMaterialAdditionsQueryArgs.filter
                : undefined;

        const { sort_order, sort_field } =
            paginatedRawMaterialAdditionsSortArgs;

        const where: Prisma.raw_material_additionsWhereInput = {
            AND: [
                {
                    date: {
                        gte: startDate,
                    },
                },
                {
                    date: {
                        lt: endDate,
                    },
                },
                {
                    active: 1,
                },
                {
                    account_id:
                        paginatedRawMaterialAdditionsQueryArgs.account_id ||
                        undefined,
                },
            ],
        };

        const orderBy: Prisma.raw_material_additionsOrderByWithRelationInput[] =
            [
                {
                    updated_at: 'desc',
                },
            ];

        if (sort_order && sort_field) {
            if (sort_field === 'date') {
                orderBy.unshift({
                    date: sort_order,
                });
            }
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

    async getCompoundName({
        raw_material_addition_id,
    }: {
        raw_material_addition_id: number | null;
    }): Promise<string> {
        if (!raw_material_addition_id) {
            return '';
        }

        const rawMaterialAdditionTotal = await this.getTotal({
            raw_material_addition_id,
        });

        const rawMaterialAddition = await this.getRawMaterialAddition({
            rawMaterialAdditionId: raw_material_addition_id,
        });

        return `${formatDate(rawMaterialAddition?.date)} (${formatFloat(
            rawMaterialAdditionTotal,
        )})`;
    }

    async isDeletable({
        rawMaterialAddition_id,
    }: {
        rawMaterialAddition_id: number;
    }): Promise<boolean> {
        return true;
    }
}
