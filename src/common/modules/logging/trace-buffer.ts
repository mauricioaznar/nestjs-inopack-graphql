import { AppLoggerService, LogContext } from './app-logger.service';

/*
 * How the trace tier narrates code that runs inside a database transaction
 * without breaking §1.7.6's rule: **no logging inside the rotation
 * transaction.**
 *
 * That rule is not stylistic. An exception thrown inside a Prisma interactive
 * transaction rolls it back, so a bug in a log line placed there could undo the
 * very revocation it was describing — silently disabling theft detection. And
 * the callback runs while holding `SELECT … FOR UPDATE` on a token family, so
 * log I/O there lengthens the critical section every concurrent rotation queues
 * behind.
 *
 * `add` is an array push. Not I/O, cannot roll a transaction back, and costs
 * nothing measurable against a row lock. `flushTo` does the actual emitting, and
 * `rotateRefreshToken` calls it *after* the transaction has returned, beside the
 * outcome logging that already runs post-commit.
 *
 * Not `@Injectable()`: one instance per rotation, constructed with `new`. A
 * shared singleton would interleave two concurrent rotations' narrations into
 * one unreadable stream — which is the problem `requestId` exists to solve, and
 * a per-call buffer solves it here for free.
 */
export class TraceBuffer {
    private readonly entries: { event: string; context: LogContext }[] = [];

    // How many lines are waiting. Read before `flushTo` clears them, so the
    // trace can report how much it buffered.
    get size(): number {
        return this.entries.length;
    }

    // Wrapped for the same reason every emit body in `AppLoggerService` is: a
    // bug in trace *collection* must not be able to break a rotation. In
    // practice the only way a push throws is an exotic argument (a Proxy whose
    // traps throw), which is exactly the kind of thing that should degrade to
    // "no trace line" rather than "no session".
    add(event: string, context: LogContext): void {
        try {
            this.entries.push({ event, context });
        } catch {
            // Intentionally silent — see above.
        }
    }

    // Emits everything collected and empties the buffer, so a second call
    // cannot duplicate a narration.
    //
    // ⚠️ Call this **after** the transaction returns, never inside it.
    //
    // The buffer fills and then discards whenever `LOG_LEVEL` is above `debug`,
    // because nothing gates `add` on the active level. Deliberate: it is a few
    // array pushes per rotation, and gating would mean the trace tier had to
    // know about levels, which is `AppLoggerService`'s job and not this class's.
    flushTo(logger: AppLoggerService): void {
        try {
            for (const entry of this.entries) {
                // `trace` cannot throw — its emit body is wrapped — so one
                // pathological context cannot swallow the rest of the run.
                logger.trace(entry.event, entry.context);
            }
        } catch {
            // Intentionally silent.
        } finally {
            this.entries.length = 0;
        }
    }
}
