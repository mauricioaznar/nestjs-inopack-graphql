import dayjs from 'dayjs';

export function getUtcDate({
    year = 2022,
    day = 1,
    month = 1,
}: {
    year?: number;
    month?: number;
    day?: number;
}): Date {
    return dayjs()
        .utc()
        .set('year', year)
        .set('month', month)
        .set('date', day)
        .toDate();
}
