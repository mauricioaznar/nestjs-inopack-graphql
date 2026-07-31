import { Logger } from '@nestjs/common';
import { AppLoggerService, LogContext } from './app-logger.service';

// A plain unit test: the service has no dependencies, so there is nothing to
// build a testing module for. What it emits is observed by spying on
// `Logger.prototype`, which is the object the service's own private `Logger`
// instance inherits its methods from.
let service: AppLoggerService;
let log: jest.SpyInstance;
let warn: jest.SpyInstance;
let error: jest.SpyInstance;
let debug: jest.SpyInstance;
let verbose: jest.SpyInstance;

beforeEach(() => {
    service = new AppLoggerService();
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => void 0);
    warn = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => void 0);
    error = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => void 0);
    debug = jest
        .spyOn(Logger.prototype, 'debug')
        .mockImplementation(() => void 0);
    verbose = jest
        .spyOn(Logger.prototype, 'verbose')
        .mockImplementation(() => void 0);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('AppLoggerService', () => {
    it('renders the event name followed by key=value pairs', () => {
        service.log('auth.login.success', { userId: 47, familyId: 'fam-1' });

        expect(String(log.mock.calls[0][0])).toEqual(
            'auth.login.success userId=47 familyId=fam-1',
        );
    });

    it('omits absent fields instead of rendering key=undefined', () => {
        service.debug('auth.refresh.no_token', { requestId: undefined });

        expect(String(debug.mock.calls[0][0])).toEqual('auth.refresh.no_token');
    });

    // The type system cannot catch a 4 KB user agent, and an unreadable line is
    // a line nobody greps.
    it('truncates a value longer than 200 characters', () => {
        service.warn('auth.origin.rejected', { reason: 'x'.repeat(500) });

        const message = String(warn.mock.calls[0][0]);
        const value = message.split('reason=')[1];
        expect(value).toEqual(`${'x'.repeat(200)}…`);
        expect(message).not.toContain('x'.repeat(201));
    });

    // ⚠️ Rule 1 of §1.7.6, and the test that matters most here. A logger that
    // can throw stops being an observer and becomes a new way for login to fail.
    it('never throws, whatever reading the context does', () => {
        const hostile = {} as LogContext;
        Object.defineProperty(hostile, 'reason', {
            enumerable: true,
            get() {
                throw new Error('reading this field explodes');
            },
        });

        expect(() => service.log('test.hostile', hostile)).not.toThrow();
        expect(() => service.warn('test.hostile', hostile)).not.toThrow();
        expect(() => service.error('test.hostile', hostile)).not.toThrow();
        expect(() => service.debug('test.hostile', hostile)).not.toThrow();
        expect(() => service.verbose('test.hostile', hostile)).not.toThrow();
        expect(() => service.trace('test.hostile', hostile)).not.toThrow();
    });

    it('never throws when the underlying logger itself fails', () => {
        warn.mockImplementation(() => {
            throw new Error('stdout is gone');
        });

        expect(() =>
            service.warn('auth.login.failed', { email: 'a@b.com' }),
        ).not.toThrow();
    });

    it('passes an error through as the stack argument', () => {
        const cause = new Error('boom');

        service.error('auth.refresh.theft', { userId: 1 }, cause);

        expect(error.mock.calls[0][1]).toEqual(cause.stack);
    });

    // 1.7.10. Nest orders `debug (0) < verbose (1) < log (2)`, so the step trace
    // has to sit *below* the routine events for granularity to increase as the
    // level drops — which means `trace` emits at Nest's `debug` and the routine
    // events emit at `verbose`. Getting these two the wrong way round is the
    // exact confusion 1.7.10 exists to remove, so it is asserted rather than
    // assumed.
    it('emits verbose through the verbose level', () => {
        service.verbose('auth.refresh.rotated', { userId: 47, tokenId: 9 });

        expect(String(verbose.mock.calls[0][0])).toEqual(
            'auth.refresh.rotated userId=47 tokenId=9',
        );
        expect(debug).not.toHaveBeenCalled();
    });

    it('emits trace one rung lower, through debug', () => {
        service.trace('auth.trace.rotate.begin', { requestId: 'abc12345' });

        expect(String(debug.mock.calls[0][0])).toEqual(
            'auth.trace.rotate.begin requestId=abc12345',
        );
        expect(verbose).not.toHaveBeenCalled();
    });

    it('renders the two trace-only context fields', () => {
        service.trace('auth.trace.rotate.family_locked', {
            familyId: 'fam-1',
            count: 3,
            detail: '1 live',
        });

        expect(String(debug.mock.calls[0][0])).toEqual(
            'auth.trace.rotate.family_locked familyId=fam-1 count=3 detail=1 live',
        );
    });
});
