import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { ActivitiesQueryArgs } from '../../common/dto/entities';
import { DatePaginator, OffsetPaginatorArgs } from '../../common/dto/pagination';

@Injectable()
export class ActivitiesService {
    constructor(private prisma: PrismaService) {}

    // Return types are inferred from Prisma on purpose. The rows carry
    // old_data/new_data as parsed JSON values, while the Activity DTO exposes
    // them as strings; the resolver's field resolvers do that conversion, so
    // annotating these as Activity[] would be a type conflict.
    //
    // Offset pagination (take/skip) rather than keyset, to match every other
    // list in this app and the shared React hook built on it. The trade-off is
    // real and accepted: activities are inserted constantly, so a row sitting
    // exactly on a page boundary can shift between page views. See §9.0 of the
    // feature doc.
    async paginatedActivities({
        offsetPaginatorArgs,
        datePaginator,
        activitiesQueryArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: DatePaginator;
        activitiesQueryArgs: ActivitiesQueryArgs;
    }) {
        const startDate = datePaginator.start_date
            ? new Date(datePaginator.start_date)
            : undefined;

        // `created_at` is a TIMESTAMP, not a date-only column: `lt` against the
        // raw end date would cut at midnight and drop the whole final day — a
        // range of today→today would return nothing. So the bound is pushed to
        // the start of the next day, making the picked end date inclusive.
        const endDate = datePaginator.end_date
            ? dayjs(datePaginator.end_date).add(1, 'day').toDate()
            : undefined;

        const activitiesWhere: Prisma.activitiesWhereInput = {
            AND: [
                {
                    entity_name: activitiesQueryArgs.entity_name || undefined,
                },
                {
                    type: activitiesQueryArgs.type || undefined,
                },
                {
                    user_id: activitiesQueryArgs.user_id || undefined,
                },
                {
                    created_at: {
                        gte: startDate || undefined,
                    },
                },
                {
                    created_at: {
                        lt: endDate || undefined,
                    },
                },
            ],
        };

        const activitiesCount = await this.prisma.activities.count({
            where: activitiesWhere,
        });

        const activities = await this.prisma.activities.findMany({
            where: activitiesWhere,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: {
                id: 'desc',
            },
        });

        return {
            count: activitiesCount,
            docs: activities,
        };
    }

    // Single activity for the audit diff dialog. The heavy old_data/new_data
    // JSON is fetched on demand by id rather than being carried by the feed.
    async getActivity({ activity_id }: { activity_id: number }) {
        return this.prisma.activities.findUnique({
            where: {
                id: activity_id,
            },
        });
    }

    // Audit history for one record, e.g. every activity on order sale 1042.
    // This is what the composite (entity_name, entity_id) index added by the
    // AddDataSnapshotsToActivities migration exists for — without it this
    // full-scans.
    //
    // Capped: a long-lived record can accumulate a lot of activities, and the
    // history panel only ever shows the recent ones.
    async getEntityActivities({
        entity_name,
        entity_id,
    }: {
        entity_name: string;
        entity_id: number;
    }) {
        return this.prisma.activities.findMany({
            where: {
                entity_name: entity_name,
                entity_id: entity_id,
            },
            orderBy: {
                id: 'desc',
            },
            take: 50,
        });
    }

    async getActivityUser({ user_id }: { user_id?: number | null }) {
        if (!user_id) return null;
        return this.prisma.users.findFirst({
            where: {
                id: user_id,
            },
        });
    }
}
