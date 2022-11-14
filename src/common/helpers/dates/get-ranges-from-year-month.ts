import dayjs, { ManipulateType } from 'dayjs';

export function getRangesFromYearMonth({
    year = 2018,
    month,
    value,
    unit,
}: {
    year?: number | null;
    month?: number | null;
    value: number;
    unit: ManipulateType;
}): {
    startDate: Date;
    endDate: Date;
} {
    month = typeof month === 'number' ? month : 0;
    year = typeof year === 'number' ? year : 2018;

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
