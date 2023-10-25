import { Injectable } from '@nestjs/common';
import { getRangesFromYearMonth } from '../../../common/helpers';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    RawMaterialAddition,
    RawMaterialAdditionItem,
    Resource,
} from '../../../common/dto/entities';

@Injectable()
export class RawMaterialAdditionItemsService {
    constructor(private prisma: PrismaService) {}

    async getRawMaterialAdditionItems(): Promise<RawMaterialAdditionItem[]> {
        // low: 1
        // very high: 7
        const { startDate, endDate } = getRangesFromYearMonth({
            year: 2022,
            month: 4,
        });

        return this.prisma.raw_material_addition_items.findMany({
            where: {
                AND: [
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async getRawMaterialAddition({
        raw_material_addition_id,
    }: {
        raw_material_addition_id: number | null;
    }): Promise<RawMaterialAddition | null> {
        if (!raw_material_addition_id) return null;

        return this.prisma.raw_material_additions.findUnique({
            where: {
                id: raw_material_addition_id,
            },
        });
    }

    async getResource({
        resource_id,
    }: {
        resource_id: number | null;
    }): Promise<Resource | null> {
        if (!resource_id) return null;

        return this.prisma.resources.findUnique({
            where: {
                id: resource_id,
            },
        });
    }
}
