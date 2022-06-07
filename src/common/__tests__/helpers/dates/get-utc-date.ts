import dayjs from 'dayjs';

export function getUtcDate({
    year,
    day,
    month,
}: {
    year: number;
    month: number;
    day: number;
}): Date {
    return dayjs()
        .utc()
        .set('year', year)
        .set('month', month)
        .set('date', day)
        .toDate();
}
