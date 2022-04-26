import dayjs, { ManipulateType } from 'dayjs';

export function getRangesFromYearMonth({
    year,
    month,
    value,
    unit,
}: {
    year: number;
    month: number;
    value: number;
    unit: ManipulateType;
}): {
    startDate: Date;
    endDate: Date;
} {
    const startDate: Date = dayjs()
        .utc()
        .set('year', year)
        .set('month', month)
        .startOf('month')
        .toDate();

    const endDate: Date = dayjs()
        .utc()
        .set('year', year)
        .set('month', month)
        .add(value, unit)
        .startOf('month')
        .toDate();

    return {
        startDate,
        endDate,
    };
}
