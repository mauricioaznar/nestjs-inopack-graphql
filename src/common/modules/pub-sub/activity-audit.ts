import { Logger } from '@nestjs/common';
import {
    ActivityEntityName,
    ActivitySnapshotStatus,
    ActivityTypeName,
} from '../../dto/entities';

/**
 * The best-effort boundary for the activity audit trail.
 *
 * **The entity write is authoritative.** History is useful operational context,
 * not a compliance requirement and not part of an entity's definition of
 * success — so nothing in this file may turn a committed entity mutation into a
 * GraphQL error, and nothing in this file wraps an entity service call.
 *
 * It exists so that policy lives in ONE place. The alternative — a hand-written
 * try/catch at each of ~29 mutation paths — is how a policy silently stops being
 * one: the twenty-ninth site catches something slightly different, or nothing at
 * all, and nobody notices until an audit failure takes a sale down with it.
 */

/** Which snapshot read failed. The only two `captureSnapshotSafely` guards. */
export type SnapshotPhase = 'old_snapshot' | 'new_snapshot';

/**
 * Every suppressed step in the audit path. The first two happen at the call
 * site (around the entity write); the rest happen inside PubSubService.
 */
export type AuditPhase =
    | SnapshotPhase
    | 'title_lookup'
    | 'activity_insert'
    | 'activity_subscription'
    | 'entity_notification';

/**
 * The result of one guarded snapshot read. `ok: false` is a real value rather
 * than a null: a failed capture and an intentionally absent one (the `old` side
 * of a create) are different facts, and collapsing them into `null` is exactly
 * how a partial capture would get rendered as "every field was added".
 */
export type SnapshotCapture =
    | { ok: true; data: unknown }
    | { ok: false; phase: SnapshotPhase };

/**
 * What an activity is about — enough to reconstruct a missing entry by hand
 * from the log alone.
 *
 * `entityId` is optional because a create has no id until the write returns;
 * pass the id in the second (new-snapshot) capture.
 */
export interface ActivityLogContext {
    entityName: ActivityEntityName;
    entityId?: number | null;
    activityType: ActivityTypeName;
    userId: number;
}

/**
 * A capture that succeeded with nothing to capture: `old` on a create, `new` on
 * a delete. Semantically a SUCCESS — absence by design, not a failure — which
 * is why it is a shared constant rather than a `null` at each call site.
 */
export const INTENTIONALLY_ABSENT: SnapshotCapture = { ok: true, data: null };

/**
 * The snapshot pair for one activity, or an explicit statement that the entity
 * has none.
 *
 * `{ supported: false }` is not "capture failed" — it is `productionPlan`,
 * whose nested-path walker is not written yet (feature doc §6.6). Keeping the
 * two apart is the whole reason `snapshot_status` exists.
 */
export type ActivitySnapshots =
    | { supported: false }
    | { supported: true; old: SnapshotCapture; new: SnapshotCapture };

export const SNAPSHOTS_NOT_SUPPORTED: ActivitySnapshots = { supported: false };

// One logger for the whole audit boundary, so every suppressed failure is
// greppable under a single context regardless of which module it happened in.
const logger = new Logger('ActivityAudit');

/**
 * The single log line for a suppressed audit failure.
 *
 * This is the ONLY channel for the original error. It is never stored in
 * `activities` and never returned through GraphQL: an exception message can
 * carry table names, column names and connection details, and an audit reader
 * has no action to take on any of it. What they get is `snapshot_status`.
 */
export function logAuditFailure({
    phase,
    context,
    error,
}: {
    phase: AuditPhase;
    context: ActivityLogContext;
    error: unknown;
}): void {
    logger.error(
        `Activity audit failed · phase=${phase} · ` +
            `entity_name=${context.entityName} · ` +
            `entity_id=${context.entityId ?? 'unknown'} · ` +
            `activity_type=${context.activityType} · ` +
            `user_id=${context.userId}. ` +
            `The entity change itself is unaffected. Original error: ${
                error instanceof Error ? error.message : String(error)
            }`,
        error instanceof Error ? error.stack : undefined,
    );
}

/**
 * Runs one snapshot query and converts a throw into a value.
 *
 * It guards the supplied callback and NOTHING else — in particular it never
 * wraps the entity service call, which must keep failing loudly. Callers pass
 * only the `getXSnapshot` read.
 *
 * A failed old-snapshot read therefore no longer stops the write from
 * happening, and a failed new-snapshot read no longer fails a mutation that
 * already committed. Both come back as `{ ok: false }` and end as
 * `capture_failed`.
 */
export async function captureSnapshotSafely(
    context: ActivityLogContext,
    phase: SnapshotPhase,
    capture: () => Promise<unknown>,
): Promise<SnapshotCapture> {
    try {
        return { ok: true, data: await capture() };
    } catch (error) {
        logAuditFailure({ phase, context, error });
        return { ok: false, phase };
    }
}

/**
 * Which sides an operation is REQUIRED to have captured for the pair to be
 * complete. The other side's absence is the operation's meaning, not a loss:
 * a create has no before, a delete has no after.
 */
function requiredSides(type: ActivityTypeName): {
    old: boolean;
    new: boolean;
} {
    switch (type) {
        case ActivityTypeName.CREATE:
            return { old: false, new: true };
        case ActivityTypeName.DELETE:
            return { old: true, new: false };
        default:
            return { old: true, new: true };
    }
}

/**
 * Derives what actually gets written from the two capture results.
 *
 * The one rule worth stating out loud: **if either required side is missing,
 * BOTH values are discarded.** Storing `old_data = NULL` next to a real new
 * snapshot would make the generic differ render the surviving side as if every
 * field had just been added — honestly computed, completely wrong. A partial
 * snapshot is worse than no snapshot, so a partial capture becomes metadata
 * only, and the reader is told why.
 *
 * "Missing" covers a thrown query AND a query that succeeded with nothing: a
 * create whose new snapshot came back null captured no more than a create whose
 * new snapshot threw, and calling the first one `complete` would render as an
 * empty diff indistinguishable from a legacy row.
 *
 * `undefined` (not `null`) is returned for an absent column: Prisma rejects a
 * literal null on a `Json?` field, wanting `Prisma.DbNull` / `Prisma.JsonNull`
 * to disambiguate SQL NULL from JSON null, and omitting the key sidesteps that.
 */
export function resolveSnapshots(
    snapshots: ActivitySnapshots,
    type: ActivityTypeName,
): {
    status: ActivitySnapshotStatus;
    oldData: unknown | undefined;
    newData: unknown | undefined;
} {
    const discarded = {
        oldData: undefined,
        newData: undefined,
    };

    if (!snapshots.supported) {
        return { status: ActivitySnapshotStatus.NOT_SUPPORTED, ...discarded };
    }

    const oldData = snapshots.old.ok
        ? snapshots.old.data ?? undefined
        : undefined;
    const newData = snapshots.new.ok
        ? snapshots.new.data ?? undefined
        : undefined;

    const required = requiredSides(type);
    if (
        (required.old && oldData === undefined) ||
        (required.new && newData === undefined)
    ) {
        return { status: ActivitySnapshotStatus.CAPTURE_FAILED, ...discarded };
    }

    return { status: ActivitySnapshotStatus.COMPLETE, oldData, newData };
}
