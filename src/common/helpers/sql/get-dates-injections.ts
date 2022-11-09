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
