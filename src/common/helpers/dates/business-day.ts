import dayjs from 'dayjs';

export const BUSINESS_TZ = 'America/Mexico_City';
const MYSQL_BUSINESS_OFFSET = '-06:00';

/**
 * INSTANT boundary: midnight of the given calendar date in Mexico City,
 * returned as a UTC Date. For example, '2026-07-01' → 2026-07-01T06:00:00.000Z.
 */
export function getBusinessDayStart(dateStr: string): Date {
    return dayjs.tz(`${dateStr} 00:00:00`, BUSINESS_TZ).utc().toDate();
}

/**
 * INSTANT boundary: midnight of the day AFTER the given calendar date in
 * Mexico City, returned as a UTC Date. Suitable as an exclusive upper bound
 * when the caller treats the picked date as inclusive.
 * For example, '2026-07-31' → 2026-08-01T06:00:00.000Z.
 */
export function getBusinessDayEndExclusive(dateStr: string): Date {
    return dayjs
        .tz(`${dateStr} 00:00:00`, BUSINESS_TZ)
        .add(1, 'day')
        .utc()
        .toDate();
}

/**
 * SQL expression that converts a UTC datetime column to Mexico business time.
 * Uses a fixed UTC offset because Mexico abolished DST in 2022.
 */
export function businessTimeSql(column: string): string {
    return `CONVERT_TZ(${column}, '+00:00', '${MYSQL_BUSINESS_OFFSET}')`;
}

/**
 * Calendar boundaries for a SQL expression that has already been converted
 * from UTC into Mexico wall time with businessTimeSql(). These are deliberately
 * local calendar strings, not UTC instants.
 */
export function getBusinessCalendarRangeSql({
    year,
    month,
}: {
    year?: number | null;
    month?: number | null;
}): {
    startDate: string;
    endDate: string;
} {
    const isMonthDefined = month !== undefined && month !== null;
    const isYearDefined = year !== undefined && year !== null;
    const startYear = isYearDefined ? year : 2018;
    const endYear = isYearDefined ? year : dayjs.utc().year();
    const start = dayjs
        .utc()
        .year(startYear)
        .month(month ?? 0)
        .startOf('month');
    const end = dayjs
        .utc()
        .year(endYear)
        .month(month ?? 0)
        .startOf('month')
        .add(1, isMonthDefined ? 'month' : 'year');

    return {
        startDate: start.format('YYYY-MM-DD 00:00:00'),
        endDate: end.format('YYYY-MM-DD 00:00:00'),
    };
}

/** Format a UTC instant for a MySQL DATETIME comparison. */
export function formatUtcDateForMysql(date: Date): string {
    return dayjs.utc(date).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * UTC datetime string for a Mexico business-day start, suitable for raw SQL.
 * For example, year=2026, month=6 (July) → '2026-07-01 06:00:00'.
 */
export function getBusinessDateRangeSql({
    year,
    month,
}: {
    year?: number | null;
    month?: number | null;
}): {
    startDate: string;
    endDate: string;
} {
    const isMonthDefined = month !== undefined && month !== null;
    const isYearDefined = year !== undefined && year !== null;
    const startYear = isYearDefined ? year : 2018;
    const endYear = isYearDefined ? year : dayjs().year();

    const start = dayjs
        .tz(
            `${startYear}-${String((month || 0) + 1).padStart(2, '0')}-01 00:00:00`,
            BUSINESS_TZ,
        )
        .utc();

    const end = dayjs
        .tz(
            `${endYear}-${String((month || 0) + 1).padStart(2, '0')}-01 00:00:00`,
            BUSINESS_TZ,
        )
        .add(1, isMonthDefined ? 'month' : 'year')
        .utc();

    return {
        startDate: start.format('YYYY-MM-DD HH:mm:ss'),
        endDate: end.format('YYYY-MM-DD HH:mm:ss'),
    };
}
