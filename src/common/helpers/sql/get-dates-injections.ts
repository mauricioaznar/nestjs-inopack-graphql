import dayjs from 'dayjs';
import { DateGroupBy } from '../../dto/dates/dates';

export const getDatesInjections = function ({
    year,
    month,
}: {
    year: null | number;
    month?: null | number;
}): {
    groupByDateGroup: string;
    orderByDateGroup: string;
    selectDateGroup: string;
} {
    if (year && month !== undefined && month !== null) {
        return {
            selectDateGroup:
                'day(ctc.start_date) day, month(ctc.start_date) month, year(ctc.start_date) year',
            groupByDateGroup:
                'day(ctc.start_date), month(ctc.start_date), year(ctc.start_date)',
            orderByDateGroup:
                'year(ctc.start_date) desc, month(ctc.start_date) desc, day(ctc.start_date) desc',
        };
    } else {
        return {
            selectDateGroup:
                'month(ctc.start_date) month, year(ctc.start_date) year',
            groupByDateGroup: 'month(ctc.start_date), year(ctc.start_date)',
            orderByDateGroup:
                'year(ctc.start_date) desc, month(ctc.start_date) desc',
        };
    }
};

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
                'day(ctc.start_date) day, month(ctc.start_date) month, year(ctc.start_date) year',
            groupByDateGroup:
                'day(ctc.start_date), month(ctc.start_date), year(ctc.start_date)',
            orderByDateGroup:
                'year(ctc.start_date) desc, month(ctc.start_date) desc, day(ctc.start_date) desc',
        };
    } else if (dateGroupBy === 'month') {
        return {
            selectDateGroup:
                'month(ctc.start_date) month, year(ctc.start_date) year',
            groupByDateGroup: 'month(ctc.start_date), year(ctc.start_date)',
            orderByDateGroup:
                'year(ctc.start_date) desc, month(ctc.start_date) desc',
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
