import { Injectable, Logger } from '@nestjs/common';

/*
 * The application logger. Console/stdout only — there is no `auth_events` table
 * and no migration behind this; `docker logs` is the reader.
 *
 * Why a wrapper at all, when `new Logger(AuthService.name)` needs no module:
 *
 * 1. Redaction is enforced in **one** place (see `LogContext`) instead of being
 *    remembered at ~15 call sites.
 * 2. It can be mocked. A `Logger` constructed inside a class cannot be replaced
 *    without module mocking; an injected provider is swapped in a testing module
 *    in one line.
 * 3. It is where the non-throwing guarantee lives — see `emit`.
 */

// The redaction allowlist, enforced by the type system.
//
// A **closed** interface on purpose: a denylist fails silently on the day
// someone adds a field it does not know about, whereas an unlisted key here is a
// compile error. There is deliberately no field for a password, an access token,
// a raw refresh token, or a `token_hash`, so none of them can be passed.
//
// ⚠️ `token_hash` is excluded on purpose and is not merely "hashed, therefore
// safe": it is the unique lookup key for a `refresh_tokens` row — the exact
// value `rotateRefreshToken` queries by — so logging it is logging a
// credential-equivalent. Name a row with `tokenId`, the integer PK.
//
// ⚠️ The compile-time guarantee has one hole: TypeScript's excess-property check
// only fires on **object literals**. Passing a pre-built variable of a wider
// type slips extra keys through. So always call with a literal —
// `logger.warn('auth.login.failed', { email, ip })` — and never build the
// context into a `const` first.
export interface LogContext {
    requestId?: string;
    userId?: number;
    email?: string;
    familyId?: string;
    tokenId?: number;
    ip?: string;
    userAgent?: string;
    reason?: string;
    durationMs?: number;

    // Added by 1.7.10 for the trace tier. Still an allowlist and still no
    // credential field: `detail` is a short note written by the trace point
    // itself ("benign", "3 live"), never attacker-supplied and never a value
    // read out of a token.
    detail?: string;
    count?: number;
}

// Belt and braces for the runtime, since the type check is not a runtime
// guarantee (anything arriving from `unknown` bypasses it). A pathological user
// agent, or a blob pasted into the email field, must not produce an unreadable
// line.
const MAX_VALUE_LENGTH = 200;

@Injectable()
export class AppLoggerService {
    // One `Logger` instance; the per-call context comes from the event's own
    // namespace (`auth.refresh.theft` renders under `[Auth]`).
    //
    // Not the *calling class*, which would need `Scope.TRANSIENT` + `INQUIRER`.
    // That was rejected: a transient provider hands every consumer its own
    // instance, and the tests overriding this provider with a spy would then
    // observe an object nobody actually logs through.
    private readonly logger = new Logger(AppLoggerService.name);

    log(event: string, context: LogContext): void {
        this.emit('log', event, context);
    }

    warn(event: string, context: LogContext): void {
        this.emit('warn', event, context);
    }

    error(event: string, context: LogContext, error?: unknown): void {
        this.emit('error', event, context, error);
    }

    // Where the routine auth events live since 1.7.10. Nest orders levels
    // `debug (0) < verbose (1) < log (2) < warn (3) < error (4)`, so `debug` is
    // the *most* inclusive setting, not the least — putting the routine events
    // at `debug` (as §1.7.5 originally did) and a step trace at `verbose` would
    // have meant `LOG_LEVEL=verbose` hid the coarser lines while showing the
    // finer ones. Granularity now increases monotonically as the level drops.
    verbose(event: string, context: LogContext): void {
        this.emit('verbose', event, context);
    }

    debug(event: string, context: LogContext): void {
        this.emit('debug', event, context);
    }

    // The step trace (1.7.10), emitted at Nest's `debug` — the bottom of the
    // ladder, so it is the last thing to switch on and the first thing off.
    //
    // A separate name rather than calling `debug` directly at the ~20 call
    // sites, because the two say different things: `debug` is "a level", `trace`
    // is "a narration point". Trace events are namespaced `auth.trace.*` so they
    // filter cleanly and can never be confused with the §1.7.5 catalogue, which
    // is the stable greppable contract. **Trace points are not a contract** —
    // they exist to be added to and deleted freely while reading the code.
    trace(event: string, context: LogContext): void {
        this.emit('debug', event, context);
    }

    // ⚠️ Rule 1 of the "a logger must never break auth" pair: this method cannot
    // throw. A logger that can throw stops being an observer and becomes a new
    // way for login to fail — and inside a Prisma interactive transaction it
    // would be worse than that, because the exception rolls the transaction back
    // and could undo the very revocation being logged. (Rule 2, "never log
    // inside the rotation transaction", makes that impossible; this makes it
    // survivable if anyone forgets.)
    //
    // Everything is inside the `try`, including reading the context: a getter
    // that throws is exactly the case the test for this asserts.
    private emit(
        level: 'log' | 'warn' | 'error' | 'debug' | 'verbose',
        event: string,
        context: LogContext,
        error?: unknown,
    ): void {
        try {
            const message = formatMessage(event, context);
            const scope = eventScope(event);

            if (level === 'error') {
                this.logger.error(message, stackOf(error), scope);
                return;
            }
            this.logger[level](message, scope);
        } catch {
            // Intentionally silent. There is nowhere left to report to, and a
            // failure to describe what happened must not change what happened.
        }
    }
}

// `event` is a stable dotted identifier (`auth.refresh.theft`), never a prose
// sentence: prose gets reworded and greps stop matching, whereas an event name
// is the thing someone actually searches `docker logs` for. The context follows
// as `key=value` pairs.
function formatMessage(event: string, context: LogContext): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(context)) {
        // An absent field is omitted rather than rendered as `key=undefined`;
        // most contexts carry an optional `requestId` or `ip`.
        if (value === undefined || value === null) {
            continue;
        }
        parts.push(`${key}=${truncate(value)}`);
    }
    return parts.length > 0 ? `${event} ${parts.join(' ')}` : event;
}

function truncate(value: unknown): string {
    const text = String(value);
    return text.length > MAX_VALUE_LENGTH
        ? `${text.slice(0, MAX_VALUE_LENGTH)}…`
        : text;
}

// `auth.refresh.theft` -> `Auth`. Gives the rendered line the same "which part
// of the app is this" column Nest's own logger has, without the wrapper needing
// to know its caller.
function eventScope(event: string): string {
    const namespace = event.split('.')[0] || 'app';
    return namespace.charAt(0).toUpperCase() + namespace.slice(1);
}

// Nest renders the second argument of `Logger#error` as the stack trace. Only
// real errors have one; anything else is stringified so a thrown string still
// leaves a trace of itself.
function stackOf(error: unknown): string | undefined {
    if (error === undefined || error === null) {
        return undefined;
    }
    if (error instanceof Error) {
        return error.stack ?? `${error.name}: ${error.message}`;
    }
    return truncate(error);
}
