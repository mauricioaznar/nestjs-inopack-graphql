import {
    Args,
    Int,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { Activity, ActivityEntityName, User } from '../../common/dto/entities';
import { ActivitiesService } from './activities.service';
import { PubSubService } from '../../common/modules/pub-sub/pub-sub.service';
import { RolesDecorator } from '../auth/decorators/role.decorator';
import { RoleId } from '../../common/dto/entities/auth/role.dto';

// The activities table stores old_data/new_data as MySQL JSON, so Prisma hands
// them back as parsed values. The GraphQL field is a String (see activity.dto),
// so every read path — query, list and subscription alike — has to serialize.
// Doing it in a field resolver rather than in the service covers all three
// uniformly; otherwise a client selecting old_data on getActivities or on the
// subscription would hand GraphQLString an object and blow up at serialization.
function serializeSnapshot(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
}

// GqlAuthGuard and GqlRolesGuard are registered globally as APP_GUARDs in
// app.module, so this resolver needs no @UseGuards of its own — the
// RolesDecorator below is enforced by the global roles guard.
@Resolver(() => Activity)
@Injectable()
export class ActivitiesResolver {
    constructor(
        private activitiesService: ActivitiesService,
        private activitiesPubSubService: PubSubService,
    ) {}

    @Query(() => [Activity])
    async getActivities() {
        return this.activitiesService.getActivities();
    }

    // Audit detail is admin-only: the snapshots carry whole rows, including
    // prices and client data as they stood at the time.
    @Query(() => Activity, { nullable: true })
    @RolesDecorator(RoleId.ADMIN)
    async getActivity(
        @Args('ActivityId', { type: () => Int }) activityId: number,
    ) {
        return this.activitiesService.getActivity({ activity_id: activityId });
    }

    // Audit history for one record, e.g. every activity on order sale 1042.
    // Same admin gate as getActivity: the history itself is only useful next to
    // the snapshots, and both expose who touched what.
    @Query(() => [Activity])
    @RolesDecorator(RoleId.ADMIN)
    async getEntityActivities(
        @Args('EntityName', { type: () => ActivityEntityName })
        entityName: ActivityEntityName,
        @Args('EntityId', { type: () => Int }) entityId: number,
    ) {
        return this.activitiesService.getEntityActivities({
            entity_name: entityName,
            entity_id: entityId,
        });
    }

    @ResolveField(() => User, { nullable: true })
    async user(@Parent() activity: Activity): Promise<User | null> {
        return this.activitiesService.getActivityUser({
            user_id: (activity as unknown as { user_id?: number | null })
                .user_id,
        });
    }

    @ResolveField(() => String, { nullable: true })
    async old_data(@Parent() activity: Activity): Promise<string | null> {
        return serializeSnapshot(
            (activity as unknown as { old_data?: unknown }).old_data,
        );
    }

    @ResolveField(() => String, { nullable: true })
    async new_data(@Parent() activity: Activity): Promise<string | null> {
        return serializeSnapshot(
            (activity as unknown as { new_data?: unknown }).new_data,
        );
    }

    @Subscription(() => Activity)
    async activity() {
        return this.activitiesPubSubService.listenForActivity();
    }
}
