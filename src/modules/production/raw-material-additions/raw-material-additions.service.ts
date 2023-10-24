import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    getCreatedAtProperty,
    getUpdatedAtProperty,
} from '../../../common/helpers';
import { OffsetPaginatorArgs } from '../../../common/dto/pagination';
import { Prisma } from '@prisma/client';
import {
    PaginatedRawMaterialAdditions,
    PaginatedRawMaterialAdditionsQueryArgs,
    PaginatedRawMaterialAdditionsSortArgs,
    RawMaterialAddition,
    RawMaterialAdditionUpsertInput,
} from '../../../common/dto/entities';

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

        return this.prisma.raw_material_additions.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                date: input.date,
            },
            update: {
                ...getUpdatedAtProperty(),
                date: input.date,
            },
            where: {
                id: input.id || 0,
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

    async isDeletable({
        rawMaterialAddition_id,
    }: {
        rawMaterialAddition_id: number;
    }): Promise<boolean> {
        return true;
    }
}
