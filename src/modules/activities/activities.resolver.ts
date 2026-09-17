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
import {
    ActivitiesQueryArgs,
    Activity,
    ActivityEntityName,
    ActivitySnapshotStatus,
    AuthenticatedUser,
    PaginatedActivities,
    User,
} from '../../common/dto/entities';
import {
    DatePaginator,
    OffsetPaginatorArgs,
} from '../../common/dto/pagination';
import { ActivitiesService } from './activities.service';
import { PubSubService } from '../../common/modules/pub-sub/pub-sub.service';
import { RolesDecorator } from '../auth/decorators/role.decorator';
import { RoleId } from '../../common/dto/entities/auth/role.dto';
import { roleSatisfiesGate } from '../auth/roles/role-access';

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

// Strict per-module isolation for the live activity feed: which BUSINESS roles
// receive an activity for each entity. The global roles (Super / General /
// Asistente General) are handled in `canSeeActivity`, not here, so this table
// lists only the domain-owning roles. Decisions baked in (confirmed 2026-09-08):
// employees are owned by BOTH Production and HR; resources sit with Expenses
// (materials / purchasing); user-management activity is super-only and so maps
// to nobody here. This table is the single source of truth for the feed's
// visibility — the `@RolesDecorator` on the subscription only admits the socket.
const ACTIVITY_VISIBILITY: Record<ActivityEntityName, RoleId[]> = {
    [ActivityEntityName.ORDER_SALE]: [RoleId.SALES, RoleId.SALES_ASSISTANT],
    [ActivityEntityName.ORDER_REQUEST]: [RoleId.SALES, RoleId.SALES_ASSISTANT],
    [ActivityEntityName.ORDER_QUOTATION]: [RoleId.SALES, RoleId.SALES_ASSISTANT],
    [ActivityEntityName.ACCOUNT]: [RoleId.SALES, RoleId.SALES_ASSISTANT],
    [ActivityEntityName.ACCOUNT_PRODUCT]: [RoleId.SALES, RoleId.SALES_ASSISTANT],
    [ActivityEntityName.PRODUCT]: [
        RoleId.PRODUCTION,
        RoleId.PRODUCTION_ASSISTANT,
    ],
    [ActivityEntityName.ORDER_PRODUCTION]: [
        RoleId.PRODUCTION,
        RoleId.PRODUCTION_ASSISTANT,
    ],
    [ActivityEntityName.ORDER_ADJUSTMENT]: [
        RoleId.PRODUCTION,
        RoleId.PRODUCTION_ASSISTANT,
    ],
    [ActivityEntityName.PRODUCTION_PLAN]: [
        RoleId.PRODUCTION,
        RoleId.PRODUCTION_ASSISTANT,
    ],
    [ActivityEntityName.MACHINE]: [
        RoleId.PRODUCTION,
        RoleId.PRODUCTION_ASSISTANT,
    ],
    [ActivityEntityName.EXPENSE]: [RoleId.EXPENSES, RoleId.EXPENSES_ASSISTANT],
    [ActivityEntityName.EXPENSE_RESOURCE]: [
        RoleId.EXPENSES,
        RoleId.EXPENSES_ASSISTANT,
    ],
    [ActivityEntityName.TRANSFER]: [RoleId.EXPENSES, RoleId.EXPENSES_ASSISTANT],
    [ActivityEntityName.RESOURCE]: [RoleId.EXPENSES, RoleId.EXPENSES_ASSISTANT],
    [ActivityEntityName.EMPLOYEE]: [
        RoleId.PRODUCTION,
        RoleId.PRODUCTION_ASSISTANT,
        RoleId.HUMAN_RESOURCES,
        RoleId.HUMAN_RESOURCES_ASSISTANT,
    ],
    // Super-only: user-management activity reaches no business role. Enforced in
    // `canSeeActivity` (Super passes before this table is read); listed here as
    // an explicit empty set so the Record stays exhaustive and the intent shows.
    [ActivityEntityName.USER]: [],
};

// The per-event authorization for the `activity` subscription. It reuses
// `roleSatisfiesGate` — the exact rule `GqlRolesGuard` applies to a query on the
// underlying entity — so the feed can never show a role an event it could not
// have read. This resolver only supplies the per-entity role set
// (ACTIVITY_VISIBILITY) and the read/super-only specifics; the global-role
// semantics (Super all, General/Asistente General over non-super domains) come
// from the shared gate. Fail-closed on an unmapped entity: an unknown
// `entity_name` resolves to an empty gate, so no business role receives it
// until it is added to the table — a missing snackbar, never a leak. (The map
// is exhaustive over ActivityEntityName, so this only guards a stray value.)
export function canSeeActivity(
    user: AuthenticatedUser | undefined,
    entityName: ActivityEntityName,
): boolean {
    const roleIds = user?.role_ids ?? [];

    // Super sees everything, user-management included.
    if (roleIds.includes(RoleId.SUPER)) {
        return true;
    }
    // User-management is a super-only area (see GqlRolesGuard); decided before
    // the shared gate, whose global-read bypass would otherwise admit General
    // and Asistente General to a `users` event.
    if (entityName === ActivityEntityName.USER) {
        return false;
    }

    // An activity event is a notification, never a write, so `isMutation` is
    // false: Asistente General's read-only bypass applies, exactly as it would
    // to a query on this entity.
    return roleSatisfiesGate(
        roleIds,
        ACTIVITY_VISIBILITY[entityName] ?? [],
        false,
    );
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

    // No @RolesDecorator: the activities page is GENERAL_VIEW and this feed
    // carries no snapshots. getActivity / getEntityActivities below keep the
    // audit-read gate — those are the ones that return whole rows.
    //
    // Deliberately NOT annotated `Promise<PaginatedActivities>`: the rows carry
    // old_data/new_data as parsed JSON while the DTO types them as strings, and
    // the field resolvers below do the conversion. Annotating would be a type
    // conflict — the same reason the service infers its return type.
    @Query(() => PaginatedActivities)
    async paginatedActivities(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: DatePaginator,
        @Args({ nullable: false }) activitiesQueryArgs: ActivitiesQueryArgs,
    ) {
        return this.activitiesService.paginatedActivities({
            offsetPaginatorArgs,
            datePaginator,
            activitiesQueryArgs,
        });
    }

    // Audit detail is read by the three global roles: Super, General and
    // Asistente General. The snapshots carry whole rows, including prices and
    // client data as they stood at the time, so nothing below the global roles
    // reaches them.
    //
    // RoleId.ADMIN is the correct decorator for that, not an approximation of
    // it: GqlRolesGuard admits Asistente General (RoleId.GUEST) to any
    // non-mutation, non-super gate by design, and this is a query. Asistente
    // General is globally read-only and already reads the live records through
    // the ordinary queries; the audit adds their historical values, which was
    // reviewed and approved. It gains no mutation capability from this gate.
    @Query(() => Activity, { nullable: true })
    @RolesDecorator(RoleId.ADMIN)
    async getActivity(
        @Args('ActivityId', { type: () => Int }) activityId: number,
    ) {
        return this.activitiesService.getActivity({ activity_id: activityId });
    }

    // Audit history for one record, e.g. every activity on order sale 1042.
    // Same gate as getActivity — Super, General and Asistente General — since
    // the history is only useful next to the snapshots and both expose who
    // touched what.
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

    // The column is VARCHAR, not a MySQL ENUM (adding a value to an ENUM is a
    // table rebuild), so the database cannot enforce the four values — this
    // resolver does. An unrecognised string reads as `legacy`, the neutral
    // reading: GraphQL would otherwise throw at serialization and take the
    // whole activity down over a field nobody can act on.
    @ResolveField(() => ActivitySnapshotStatus)
    async snapshot_status(
        @Parent() activity: Activity,
    ): Promise<ActivitySnapshotStatus> {
        const raw = (
            activity as unknown as { snapshot_status?: string | null }
        ).snapshot_status;
        const isKnown = (Object.values(ActivitySnapshotStatus) as string[]).includes(
            raw ?? '',
        );
        return isKnown
            ? (raw as ActivitySnapshotStatus)
            : ActivitySnapshotStatus.LEGACY;
    }

    // Two layers, deliberately. The @RolesDecorator is ADMISSION only — the
    // global GqlRolesGuard checks it once, when the socket subscribes, and admits
    // any business role that owns at least one activity domain (plus the global
    // roles the guard always lets through). It is all-or-nothing and cannot say
    // which entity types a role receives. The `filter` is the per-event gate: it
    // runs for every published activity and applies ACTIVITY_VISIBILITY via
    // `canSeeActivity`, so a Ventas socket never sees a Gastos event and vice
    // versa. The decorator gates the socket; the mapping gates each snackbar.
    @Subscription(() => Activity, {
        filter: (
            payload: { activity: { entity_name: ActivityEntityName } },
            _variables: unknown,
            context: { req?: { user?: AuthenticatedUser } },
        ) => canSeeActivity(context?.req?.user, payload.activity.entity_name),
    })
    @RolesDecorator(
        RoleId.SALES,
        RoleId.SALES_ASSISTANT,
        RoleId.PRODUCTION,
        RoleId.PRODUCTION_ASSISTANT,
        RoleId.EXPENSES,
        RoleId.EXPENSES_ASSISTANT,
        RoleId.HUMAN_RESOURCES,
        RoleId.HUMAN_RESOURCES_ASSISTANT,
    )
    async activity() {
        return this.activitiesPubSubService.listenForActivity();
    }
}
