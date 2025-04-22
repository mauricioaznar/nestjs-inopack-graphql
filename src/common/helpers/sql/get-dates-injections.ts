import dayjs from 'dayjs';
import { DateGroupBy } from '../../dto/dates/dates';

export const getDatesInjectionsV2 = function ({
    dateGroupBy,
}: {
    dateGroupBy: DateGroupBy;
}): {
    groupByDateGroup: string;
    orderByDateGroup: string;
    selectDateGroup: string;
} {
    if (dateGroupBy === 'day') {
        return {
            selectDateGroup:
                `cast(day(ctc.start_date) as decimal(12 ,2)) as day, cast(month(ctc.start_date) as decimal(12 ,2)) as month, year(ctc.start_date) year`,
            groupByDateGroup:
                'day, month, year(ctc.start_date)',
            orderByDateGroup:
                'year(ctc.start_date) desc, month desc, day desc',
        };
    } else if (dateGroupBy === 'month') {
        return {
            selectDateGroup:
                'cast(month(ctc.start_date) as decimal(12 ,2)) as month, year(ctc.start_date) year',
            groupByDateGroup: 'month, year(ctc.start_date)',
            orderByDateGroup:
                'year(ctc.start_date) desc, month desc',
        };
    } else {
        return {
            selectDateGroup: 'year(ctc.start_date) year',
            groupByDateGroup: 'year(ctc.start_date)',
            orderByDateGroup: 'year(ctc.start_date) desc',
        };
    }
};

export function getDateRangeSql({
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

    const startDate = dayjs()
        .utc()
        .set('year', startYear)
        .set('month', month || 0)
        .startOf('month')
        .format('YYYY-MM-DD');

    const endDate = dayjs()
        .utc()
        .set('year', endYear)
        .set('month', month || 0)
        .add(1, isMonthDefined ? 'month' : 'year')
        .startOf('month')
        .format('YYYY-MM-DD');

    return {
        startDate,
        endDate,
    };
}
