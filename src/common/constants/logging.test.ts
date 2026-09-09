import { logLevels } from './logging';

// `logLevels()` reads `process.env` on every call — deliberately not memoised
// the way `corsOrigins()` is — which is what makes these cases possible at all.
// `.env.test` sets both `NODE_ENV` and `LOG_LEVEL`, so each case has to clear
// them itself and the originals go back afterwards.
const originalNodeEnv = process.env.NODE_ENV;
const originalLogLevel = process.env.LOG_LEVEL;

function withEnv(nodeEnv?: string, logLevel?: string) {
    if (nodeEnv === undefined) {
        delete process.env.NODE_ENV;
    } else {
        process.env.NODE_ENV = nodeEnv;
    }
    if (logLevel === undefined) {
        delete process.env.LOG_LEVEL;
    } else {
        process.env.LOG_LEVEL = logLevel;
    }
}

afterEach(() => {
    withEnv(originalNodeEnv, originalLogLevel);
});

describe('logLevels', () => {
    describe('defaults, when LOG_LEVEL is unset', () => {
        it('production keeps rotation success (debug) switched off', () => {
            withEnv('production', undefined);

            expect(logLevels()).toEqual(['log', 'warn', 'error']);
        });

        it('test stays at warn so login noise cannot bury a failure', () => {
            withEnv('test', undefined);

            expect(logLevels()).toEqual(['warn', 'error']);
        });

        // Every auth decision, but not the step trace: `debug` is one rung
        // lower and is a deliberate "narrate everything" opt-in.
        it('anything else sees every decision but not the step trace', () => {
            withEnv('dev', undefined);

            expect(logLevels()).toEqual(['verbose', 'log', 'warn', 'error']);
        });
    });

    // The whole ladder, and the reason `trace` sits at the bottom: `debug` is
    // the *most* inclusive setting in Nest, not the least.
    it('expands debug to every level, trace included', () => {
        withEnv('dev', 'debug');

        expect(logLevels()).toEqual([
            'debug',
            'verbose',
            'log',
            'warn',
            'error',
        ]);
    });

    // The expansion is the point: Nest derives its threshold from the *highest*
    // value in the array, so a single-element `['log']` would behave the same
    // here but `['debug']` would silently enable everything. Returning the tail
    // makes both cases obvious.
    it('expands a threshold into itself and every louder level', () => {
        withEnv('production', 'log');

        expect(logLevels()).toEqual(['log', 'warn', 'error']);
    });

    it('expands the loudest threshold to just itself', () => {
        withEnv('production', 'error');

        expect(logLevels()).toEqual(['error']);
    });

    it('accepts a threshold whatever its casing or padding', () => {
        withEnv('production', '  WARN ');

        expect(logLevels()).toEqual(['warn', 'error']);
    });

    // A silent fallback would mean a typo'd LOG_LEVEL quietly disables logging,
    // discovered at exactly the moment someone needs the logs.
    it('throws on an unrecognised value, naming it', () => {
        withEnv('production', 'verbse');

        expect(() => logLevels()).toThrow(/verbse/);
    });
});
