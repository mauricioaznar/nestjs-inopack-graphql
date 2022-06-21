import dayjs from 'dayjs';

const DEFAULT_YEAR = 2022;
const DEFAULT_MONTH = 1;
const DEFAULT_DAY = 1;

export function getUtcDate(dates?: {
    year?: number;
    month?: number;
    day?: number;
}): Date {
    const {
        year = DEFAULT_YEAR,
        month = DEFAULT_MONTH,
        day = DEFAULT_DAY,
    } = dates
        ? dates
        : {
              year: DEFAULT_YEAR,
              month: DEFAULT_MONTH,
              day: DEFAULT_DAY,
          };

    return dayjs()
        .utc()
        .set('year', year)
        .set('month', month)
        .set('date', day)
        .set('hour', 0)
        .set('minutes', 0)
        .set('seconds', 0)
        .toDate();
}
