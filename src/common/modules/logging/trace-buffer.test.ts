import { Logger } from '@nestjs/common';
import { AppLoggerService, LogContext } from './app-logger.service';
import { TraceBuffer } from './trace-buffer';

// The buffer's whole reason to exist is that the rotation transaction cannot
// afford I/O or an exception, so these tests are about what it *refuses* to do
// rather than what it emits.
let buffer: TraceBuffer;
let logger: AppLoggerService;
let trace: jest.SpyInstance;

beforeEach(() => {
    buffer = new TraceBuffer();
    logger = new AppLoggerService();
    trace = jest.spyOn(logger, 'trace').mockImplementation(() => void 0);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('TraceBuffer', () => {
    it('emits nothing until it is flushed', () => {
        buffer.add('auth.trace.rotate.row_found', { tokenId: 7 });
        buffer.add('auth.trace.rotate.row_revoked', { tokenId: 7 });

        // This is the property the rotation depends on: `add` is an array push,
        // so nothing reaches the logger while the transaction is open.
        expect(trace).not.toHaveBeenCalled();
        expect(buffer.size).toEqual(2);

        buffer.flushTo(logger);

        expect(trace).toHaveBeenCalledTimes(2);
        expect(trace.mock.calls[0][0]).toEqual('auth.trace.rotate.row_found');
        expect(trace.mock.calls[1][0]).toEqual('auth.trace.rotate.row_revoked');
    });

    it('empties on flush, so a second flush cannot duplicate a narration', () => {
        buffer.add('auth.trace.rotate.row_found', { tokenId: 7 });

        buffer.flushTo(logger);
        buffer.flushTo(logger);

        expect(trace).toHaveBeenCalledTimes(1);
        expect(buffer.size).toEqual(0);
    });

    // The 1.7.10 acceptance criterion. A bug in trace *collection* must not be
    // able to break a rotation — it would roll back the transaction it was
    // narrating.
    it('never throws from add, whatever reading the context does', () => {
        const hostile = {} as LogContext;
        Object.defineProperty(hostile, 'detail', {
            enumerable: true,
            get() {
                throw new Error('reading this field explodes');
            },
        });

        expect(() =>
            buffer.add('auth.trace.rotate.family_locked', hostile),
        ).not.toThrow();
    });

    it('never throws from flush, and one bad entry does not lose the rest', () => {
        const hostile = {} as LogContext;
        Object.defineProperty(hostile, 'detail', {
            enumerable: true,
            get() {
                throw new Error('reading this field explodes');
            },
        });

        // The **real** `trace` this time, with only the underlying sink stubbed:
        // it is `AppLoggerService`'s own emit body that swallows the throwing
        // getter, and this asserts the buffer relies on that rather than
        // aborting its loop at the first bad entry.
        trace.mockRestore();
        const sink = jest
            .spyOn(Logger.prototype, 'debug')
            .mockImplementation(() => void 0);

        buffer.add('auth.trace.rotate.family_locked', hostile);
        buffer.add('auth.trace.rotate.row_found', { tokenId: 7 });

        expect(() => buffer.flushTo(logger)).not.toThrow();
        expect(buffer.size).toEqual(0);
        // Both entries were attempted; the hostile one produced no line.
        expect(sink).toHaveBeenCalledTimes(1);
        expect(String(sink.mock.calls[0][0])).toContain(
            'auth.trace.rotate.row_found',
        );
    });
});
