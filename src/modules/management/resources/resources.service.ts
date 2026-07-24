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
import {
    OffsetPaginatorArgs,
    DatePaginator,
} from '../../../common/dto/pagination';
import {
    getCreatedAtProperty,
    getCreatedByProperty,
    getUpdatedAtProperty,
    getUpdatedByProperty,
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
        { current_user_id }: { current_user_id?: number | null } = {},
    ): Promise<Resource> {
        await this.validateUpsertResource(resourceInput);

        return this.prisma.resources.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                ...getCreatedByProperty(current_user_id),
                ...getUpdatedByProperty(current_user_id),
                name: resourceInput.name,
                resource_category_id: resourceInput.resource_category_id,
                current_group_weight: resourceInput.current_group_weight || 0,
                current_unit_price: resourceInput.current_unit_price || 0,
                current_group_price: resourceInput.current_group_price || 0,
                group_weight_strict: resourceInput.group_weight_strict || 0,
                include_units_in_summary:
                    resourceInput.include_units_in_summary,
                unit_price_name: resourceInput.unit_price_name,
            },
            update: {
                ...getUpdatedAtProperty(),
                ...getUpdatedByProperty(current_user_id),
                name: resourceInput.name,
                resource_category_id: resourceInput.resource_category_id,
                current_group_weight: resourceInput.current_group_weight || 0,
                current_unit_price: resourceInput.current_unit_price || 0,
                current_group_price: resourceInput.current_group_price || 0,
                group_weight_strict: resourceInput.group_weight_strict || 0,
                include_units_in_summary:
                    resourceInput.include_units_in_summary,
                unit_price_name: resourceInput.unit_price_name,
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
        datePaginator: DatePaginator;
        resourcesQueryArgs: ResourcesQueryArgs;
        resourcesSortArgs: ResourcesSortArgs;
    }): Promise<PaginatedResources> {
        const startDate = datePaginator.start_date
            ? new Date(datePaginator.start_date)
            : undefined;
        const endDate = datePaginator.end_date
            ? new Date(datePaginator.end_date)
            : undefined;

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
                ...(filter
                    ? [
                          {
                              name: {
                                  contains: filter,
                              },
                          },
                      ]
                    : []),
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
        current_user_id,
    }: {
        resource_id: number;
        current_user_id?: number | null;
    }): Promise<boolean> {
        if (!resource_id) {
            throw new NotFoundException();
        }

        await this.prisma.resources.update({
            data: {
                active: -1,
                ...getUpdatedByProperty(current_user_id),
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
        return resource_id > 0;
    }

    async isEditable({
        resource_id,
    }: {
        resource_id: number;
    }): Promise<boolean> {
        return true;
    }
}
