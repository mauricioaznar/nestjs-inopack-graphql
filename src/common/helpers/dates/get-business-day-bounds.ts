import dayjs from 'dayjs';
import utcPlugin from 'dayjs/plugin/utc';
import timezonePlugin from 'dayjs/plugin/timezone';

// Extending here rather than relying on appConfig(): these helpers are pure and
// are unit-tested without booting Nest, so the plugins have to be installed by
// importing the module. dayjs.extend is idempotent, so doing it in both places
// is safe. The timezone plugin requires the utc plugin, hence both.
// Neither is a new package — both ship inside the already-installed dayjs.
dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);

/**
 * The company operates in Merida; Mexico City is the canonical IANA zone for
 * that offset and the one the business day is defined in. Mexico has had no DST
 * since 2022, but naming the zone rather than hard-coding -06:00 keeps the
 * conversion correct if that ever changes again.
 */
export const BUSINESS_TIME_ZONE = 'America/Mexico_City';

const CALENDAR_DAY_FORMAT = 'YYYY-MM-DD';

/**
 * Only the calendar-day part of the input is read: the paginator's contract is
 * `YYYY-MM-DD` (see DatePaginator), and slicing makes an accidental ISO string
 * carrying a time mean the same day rather than shifting a boundary.
 */
function toCalendarDay(date: string): string {
    return date.slice(0, 10);
}

/**
 * The instant a Mexico City calendar day begins, as a UTC `Date`.
 *
 * The string is parsed IN the business zone — never with `new Date('...')`,
 * which reads a bare date as midnight UTC, and never with a bare `dayjs('...')`,
 * which reads it in whatever zone the server happens to run in. Mixing those two
 * readings inside one range is how a filter ends up six hours wide at one end.
 */
function startOfBusinessDay(calendarDay: string): Date {
    return dayjs.tz(calendarDay, BUSINESS_TIME_ZONE).toDate();
}

/**
 * INCLUSIVE lower bound: the instant the selected Mexico City day begins,
 * expressed in UTC. Use with `gte`.
 */
export function getBusinessDayStart(date?: string | null): Date | undefined {
    if (!date) return undefined;
    return startOfBusinessDay(toCalendarDay(date));
}

/**
 * EXCLUSIVE upper bound: the instant the day AFTER the selected Mexico City day
 * begins, expressed in UTC. Use with `lt`.
 *
 * Why the next day rather than `endOf('day')`: the column is a timestamp, so a
 * bound at the selected day's own midnight would drop that entire day (a
 * today→today range would return nothing), and `endOf('day')` leaves a
 * sub-millisecond hole. Start-of-next-day with `lt` has neither problem.
 *
 * The +1 day is done on the CALENDAR DATE and the result re-parsed in the zone,
 * rather than adding 24 hours to the start instant. Those differ on a DST
 * transition — Mexico has none today, but a date-string increment cannot be
 * wrong either way.
 */
export function getBusinessDayEndExclusive(
    date?: string | null,
): Date | undefined {
    if (!date) return undefined;
    const nextCalendarDay = dayjs
        .utc(toCalendarDay(date))
        .add(1, 'day')
        .format(CALENDAR_DAY_FORMAT);
    return startOfBusinessDay(nextCalendarDay);
}
