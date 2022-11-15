import dayjs, { ManipulateType } from 'dayjs';

export function getRangesFromYearMonth({
    year = 2018,
    month,
}: {
    year?: number | null;
    month?: number | null;
}): {
    startDate: Date;
    endDate?: Date;
} {
    const isYearDefined = typeof year === 'number';
    const isMonthDefined = typeof month === 'number';

    month = isMonthDefined && month !== null && month !== undefined ? month : 0;
    year = isYearDefined && year !== null ? year : 2018;
    const unit = !isMonthDefined ? 'year' : 'month';

    const startDate: Date = dayjs()
        .utc()
        .set('year', year)
        .set('month', month || 0)
        .startOf(unit)
        .toDate();

    if (!isYearDefined && !isMonthDefined) {
        return {
            startDate,
            endDate: undefined,
        };
    }

    const endDate: Date = dayjs()
        .utc()
        .set('year', year)
        .set('month', isMonthDefined ? month : 0)
        .add(1, unit)
        .startOf('month')
        .toDate();

    return {
        startDate,
        endDate,
    };
}
