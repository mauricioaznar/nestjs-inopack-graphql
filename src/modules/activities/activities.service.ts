import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/modules/prisma/prisma.service';

@Injectable()
export class ActivitiesService {
    constructor(private prisma: PrismaService) {}

    // Return types are inferred from Prisma on purpose. The rows carry
    // old_data/new_data as parsed JSON values, while the Activity DTO exposes
    // them as strings; the resolver's field resolvers do that conversion, so
    // annotating these as Activity[] would be a type conflict.
    async getActivities() {
        return this.prisma.activities.findMany({
            orderBy: {
                id: 'desc',
            },
            take: 15,
        });
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
