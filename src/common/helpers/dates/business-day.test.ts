import dayjs from 'dayjs';
import utcPlugin from 'dayjs/plugin/utc';
import timezonePlugin from 'dayjs/plugin/timezone';
import {
    getBusinessDayStart,
    getBusinessDayEndExclusive,
    getBusinessDateRangeSql,
} from './business-day';

dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);

describe('getBusinessDayStart', () => {
    it('returns Mexico midnight as UTC (July 1)', () => {
        const result = getBusinessDayStart('2026-07-01');
        expect(result.toISOString()).toBe('2026-07-01T06:00:00.000Z');
    });

    it('returns Mexico midnight as UTC (August 1)', () => {
        const result = getBusinessDayStart('2026-08-01');
        expect(result.toISOString()).toBe('2026-08-01T06:00:00.000Z');
    });
});

describe('getBusinessDayEndExclusive', () => {
    it('returns next-day Mexico midnight as UTC', () => {
        const result = getBusinessDayEndExclusive('2026-07-31');
        expect(result.toISOString()).toBe('2026-08-01T06:00:00.000Z');
    });

    it('single-day range is a full Mexico day, not empty', () => {
        const start = getBusinessDayStart('2026-07-31');
        const end = getBusinessDayEndExclusive('2026-07-31');
        expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
    });
});

describe('July Contabilidad boundaries', () => {
    it('July boundaries are 2026-07-01T06:00Z to 2026-08-01T06:00Z', () => {
        const start = getBusinessDayStart('2026-07-01');
        const end = getBusinessDayStart('2026-08-01');
        expect(start.toISOString()).toBe('2026-07-01T06:00:00.000Z');
        expect(end.toISOString()).toBe('2026-08-01T06:00:00.000Z');
    });

    it('Mexico 2026-07-31 21:00 (UTC 2026-08-01 03:00) is inside July', () => {
        const instant = new Date('2026-08-01T03:00:00.000Z');
        const julyStart = getBusinessDayStart('2026-07-01');
        const julyEnd = getBusinessDayStart('2026-08-01');
        expect(instant >= julyStart).toBe(true);
        expect(instant < julyEnd).toBe(true);
    });

    it('same instant is outside August', () => {
        const instant = new Date('2026-08-01T03:00:00.000Z');
        const augStart = getBusinessDayStart('2026-08-01');
        expect(instant >= augStart).toBe(false);
    });
});

describe('null boundaries remain unbounded', () => {
    it('helpers produce valid dates for any date string', () => {
        const result = getBusinessDayStart('2026-01-01');
        expect(result).toBeInstanceOf(Date);
        expect(Number.isNaN(result.getTime())).toBe(false);
    });
});

describe('getBusinessDateRangeSql', () => {
    it('July 2026 range uses Mexico business boundaries', () => {
        const { startDate, endDate } = getBusinessDateRangeSql({
            year: 2026,
            month: 6,
        });
        expect(startDate).toBe('2026-07-01 06:00:00');
        expect(endDate).toBe('2026-08-01 06:00:00');
    });

    it('full year range spans Mexico business year', () => {
        const { startDate, endDate } = getBusinessDateRangeSql({
            year: 2026,
        });
        expect(startDate).toBe('2026-01-01 06:00:00');
        expect(endDate).toBe('2027-01-01 06:00:00');
    });
});
