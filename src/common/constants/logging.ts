import { LogLevel } from '@nestjs/common';

// Single access point for "how loud is this process". Same shape as
// `constants/jwt.ts` and `constants/cors.ts`: the environment is read here and
// nowhere else, so there is exactly one place to look when the logs are not
// saying what someone expected.
//
// Ordered cheapest-to-loudest, matching Nest's own `LOG_LEVEL_VALUES`. The order
// is load-bearing — `logLevels()` slices this array, so a threshold enables
// itself and everything after it.
const ORDERED_LEVELS: LogLevel[] = ['debug', 'verbose', 'log', 'warn', 'error'];

// `LOG_LEVEL` is a *threshold*, not a list. A typo must not be forgiving: a
// silent fallback would quietly disable logging and the discovery happens at the
// exact moment someone needs the logs. Fail at boot, name the bad value.
function readThreshold(): LogLevel {
    const raw = (process.env.LOG_LEVEL || '').trim().toLowerCase();

    if (raw.length === 0) {
        // Production stays at `log`: rotation success is `verbose` precisely so
        // a healthy API does not write a line per refresh per user.
        if (process.env.NODE_ENV === 'production') {
            return 'log';
        }
        // The auth suite logs in and out constantly. At `log` those lines bury
        // the actual test failures.
        if (process.env.NODE_ENV === 'test') {
            return 'warn';
        }
        // Local development sees every auth *decision* — but not the 1.7.10
        // step trace, which sits one rung lower at `debug`. Narrating every
        // statement of every request is an opt-in, not the thing you get for
        // running `npm run dev`.
        return 'verbose';
    }

    const match = ORDERED_LEVELS.find((level) => level === raw);
    if (!match) {
        throw new Error(
            `LOG_LEVEL must be one of ${ORDERED_LEVELS.join(', ')}, got ` +
                `"${process.env.LOG_LEVEL}"`,
        );
    }
    return match;
}

// Returns the **expanded** list rather than a single-element array, and that is
// not cosmetic. From
// `node_modules/@nestjs/common/services/utils/is-log-level-enabled.util.js`:
//
//     LOG_LEVEL_VALUES = { debug: 0, verbose: 1, log: 2, warn: 3, error: 4 }
//     // enabled if explicitly listed, OR value >= the highest value in the list
//
// The threshold is derived from the *highest* value present, so `['debug']`
// enables every level (debug is the lowest) while `['error']` enables only
// error. Passing the whole tail makes the behaviour obvious to a reader and
// immune to that quirk.
//
// Deliberately not memoised the way `corsOrigins()` is: this is called once, at
// boot, and its tests need to vary `NODE_ENV` / `LOG_LEVEL` between cases.
export function logLevels(): LogLevel[] {
    const threshold = readThreshold();
    return ORDERED_LEVELS.slice(ORDERED_LEVELS.indexOf(threshold));
}
