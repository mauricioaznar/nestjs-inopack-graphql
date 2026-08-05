import {
    getBusinessDayEndExclusive,
    getBusinessDayStart,
} from './get-business-day-bounds';

// Mexico City is UTC-6 (no DST since 2022), so a business day that starts at
// 00:00 locally starts at 06:00 UTC on the same calendar date. Every expected
// instant below is that conversion.

/**
 * Exactly what the Prisma filter does with the two bounds: `created_at >= start`
 * AND `created_at < end`. Written out here so the boundary cases below assert on
 * the semantics the query has, not just on two Date values.
 */
function isWithinRange(
    createdAt: string,
    { start, end }: { start?: Date; end?: Date },
): boolean {
    const instant = new Date(createdAt).getTime();
    if (start && instant < start.getTime()) return false;
    if (end && instant >= end.getTime()) return false;
    return true;
}

describe('business day bounds (America/Mexico_City)', () => {
    it('converts a calendar day to the UTC instant it begins at', () => {
        expect(getBusinessDayStart('2026-08-03')?.toISOString()).toBe(
            '2026-08-03T06:00:00.000Z',
        );
        expect(getBusinessDayEndExclusive('2026-08-03')?.toISOString()).toBe(
            '2026-08-04T06:00:00.000Z',
        );
    });

    it('returns undefined for an absent bound, leaving that end open', () => {
        expect(getBusinessDayStart(null)).toBeUndefined();
        expect(getBusinessDayStart('')).toBeUndefined();
        expect(getBusinessDayEndExclusive(undefined)).toBeUndefined();
    });

    describe('today -> today', () => {
        const start = getBusinessDayStart('2026-08-03');
        const end = getBusinessDayEndExclusive('2026-08-03');

        it('spans exactly one Mexico City day', () => {
            expect(start?.toISOString()).toBe('2026-08-03T06:00:00.000Z');
            expect(end?.toISOString()).toBe('2026-08-04T06:00:00.000Z');
        });

        it('includes an activity from the middle of that day', () => {
            // 11:15 in Mexico City.
            expect(
                isWithinRange('2026-08-03T17:15:00.000Z', { start, end }),
            ).toBe(true);
        });

        it('includes a late-evening activity that lands on the next UTC date', () => {
            // 23:30 in Mexico City on 03/08 — 05:30 UTC on 04/08. This is the
            // case a UTC-day filter drops.
            expect(
                isWithinRange('2026-08-04T05:30:00.000Z', { start, end }),
            ).toBe(true);
        });

        it('excludes an activity from the previous Mexico City evening', () => {
            // 20:00 on 02/08 in Mexico City — 02:00 UTC on 03/08. A filter that
            // parsed the start date as midnight UTC would wrongly include it.
            expect(
                isWithinRange('2026-08-03T02:00:00.000Z', { start, end }),
            ).toBe(false);
        });
    });

    describe('a multi-day range', () => {
        const start = getBusinessDayStart('2026-08-01');
        const end = getBusinessDayEndExclusive('2026-08-03');

        it('runs from the first day to the start of the day after the last', () => {
            expect(start?.toISOString()).toBe('2026-08-01T06:00:00.000Z');
            expect(end?.toISOString()).toBe('2026-08-04T06:00:00.000Z');
        });

        it('includes activities on the first, middle and last day', () => {
            expect(
                isWithinRange('2026-08-01T06:00:00.000Z', { start, end }),
            ).toBe(true);
            expect(
                isWithinRange('2026-08-02T18:00:00.000Z', { start, end }),
            ).toBe(true);
            expect(
                isWithinRange('2026-08-04T05:59:59.999Z', { start, end }),
            ).toBe(true);
        });

        it('crosses a month boundary without shifting the days', () => {
            expect(getBusinessDayStart('2026-07-31')?.toISOString()).toBe(
                '2026-07-31T06:00:00.000Z',
            );
            expect(getBusinessDayEndExclusive('2026-07-31')?.toISOString()).toBe(
                '2026-08-01T06:00:00.000Z',
            );
        });
    });

    describe('the instants either side of each boundary', () => {
        const start = getBusinessDayStart('2026-08-03');
        const end = getBusinessDayEndExclusive('2026-08-03');

        it('excludes the millisecond before the day starts', () => {
            expect(
                isWithinRange('2026-08-03T05:59:59.999Z', { start, end }),
            ).toBe(false);
        });

        it('includes the first millisecond of the day', () => {
            expect(
                isWithinRange('2026-08-03T06:00:00.000Z', { start, end }),
            ).toBe(true);
        });

        it('includes the last millisecond of the day', () => {
            expect(
                isWithinRange('2026-08-04T05:59:59.999Z', { start, end }),
            ).toBe(true);
        });

        it('excludes the first millisecond of the next day', () => {
            expect(
                isWithinRange('2026-08-04T06:00:00.000Z', { start, end }),
            ).toBe(false);
        });
    });

    it('reads only the calendar day when handed a full ISO string', () => {
        // Defensive: the paginator's contract is YYYY-MM-DD, and a value that
        // carries a time must still mean that same calendar day.
        expect(
            getBusinessDayStart('2026-08-03T00:00:00.000Z')?.toISOString(),
        ).toBe('2026-08-03T06:00:00.000Z');
    });
});
