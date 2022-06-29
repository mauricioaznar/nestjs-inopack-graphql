import dayjs, { ManipulateType } from 'dayjs';

export function getRangesFromYearMonth({
    year,
    month,
    value,
    unit,
}: {
    year: number;
    month?: number | null;
    value: number;
    unit: ManipulateType;
}): {
    startDate: Date;
    endDate: Date;
} {
    const startDate: Date = dayjs()
        .utc()
        .set('year', year)
        .set('month', month || 0)
        .startOf('month')
        .toDate();

    const endDate: Date = dayjs()
        .utc()
        .set('year', year)
        .set('month', month || 0)
        .add(value, unit)
        .startOf('month')
        .toDate();

    return {
        startDate,
        endDate,
    };
}
