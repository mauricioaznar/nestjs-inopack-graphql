import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    ResourcesQueryArgs,
    ResourcesSortArgs,
    PaginatedResources,
    Resource,
    ResourceUpsertInput,
    ResourceCategory,
    ResourcesGetQueryArgs,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import {
    getCreatedAtProperty,
    getRangesFromYearMonth,
    getUpdatedAtProperty,
} from '../../../common/helpers';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResourcesService {
    constructor(private prisma: PrismaService) {}

    async getResource({
        resource_id,
    }: {
        resource_id: number;
    }): Promise<Resource | null> {
        return this.prisma.resources.findFirst({
            where: {
                id: resource_id,
                active: 1,
            },
        });
    }

    async getResources({
        resourcesGetQueryArgs,
    }: {
        resourcesGetQueryArgs: ResourcesGetQueryArgs;
    }): Promise<Resource[]> {
        const { resource_category_id } = resourcesGetQueryArgs;
        return this.prisma.resources.findMany({
            where: {
                active: 1,
                resource_category_id: resource_category_id
                    ? {
                          in: resource_category_id,
                      }
                    : undefined,
            },
        });
    }

    async getResourceCategory({
        resource_category_id,
    }: {
        resource_category_id: number | null;
    }): Promise<ResourceCategory | null> {
        if (!resource_category_id) {
            return null;
        }

        const resourceCategory =
            await this.prisma.resource_categories.findFirst({
                where: {
                    id: resource_category_id,
                },
            });
        return resourceCategory;
    }

    async upsertResource(
        resourceInput: ResourceUpsertInput,
    ): Promise<Resource> {
        await this.validateUpsertResource(resourceInput);

        return this.prisma.resources.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                name: resourceInput.name,
                resource_category_id: resourceInput.resource_category_id,
            },
            update: {
                ...getUpdatedAtProperty(),
                name: resourceInput.name,
                resource_category_id: resourceInput.resource_category_id,
            },
            where: {
                id: resourceInput.id || 0,
            },
        });
    }

    async paginatedResources({
        offsetPaginatorArgs,
        datePaginator,
        resourcesQueryArgs,
        resourcesSortArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: YearMonth;
        resourcesQueryArgs: ResourcesQueryArgs;
        resourcesSortArgs: ResourcesSortArgs;
    }): Promise<PaginatedResources> {
        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
        });

        const { sort_order, sort_field } = resourcesSortArgs;

        const filter =
            resourcesQueryArgs.filter !== '' && !!resourcesQueryArgs.filter
                ? resourcesQueryArgs.filter
                : undefined;

        const isFilterANumber = !Number.isNaN(Number(filter));

        const resourcesWhere: Prisma.resourcesWhereInput = {
            AND: [
                {
                    active: 1,
                },
            ],
        };
        let orderBy: Prisma.resourcesOrderByWithRelationInput = {
            updated_at: 'desc',
        };

        if (sort_order && sort_field) {
            if (sort_field === 'name') {
                orderBy = {
                    name: sort_order,
                };
            }
        }

        const resourcesCount = await this.prisma.resources.count({
            where: resourcesWhere,
        });

        const resources = await this.prisma.resources.findMany({
            where: resourcesWhere,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: orderBy,
        });

        return {
            count: resourcesCount,
            docs: resources,
        };
    }

    async validateUpsertResource(
        resourceUpsertInput: ResourceUpsertInput,
    ): Promise<void> {
        const errors: string[] = [];

        // order production type cant change

        if (resourceUpsertInput.id) {
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async deleteResource({
        resource_id,
    }: {
        resource_id: number;
    }): Promise<boolean> {
        const resource = await this.getResource({ resource_id: resource_id });

        if (!resource_id) {
            throw new NotFoundException();
        }

        await this.prisma.resources.update({
            data: {
                active: -1,
            },
            where: {
                id: resource_id,
            },
        });

        return true;
    }

    async isDeletable({
        resource_id,
    }: {
        resource_id: number;
    }): Promise<boolean> {
        return true;
    }

    async isEditable({
        resource_id,
    }: {
        resource_id: number;
    }): Promise<boolean> {
        return true;
    }
}
