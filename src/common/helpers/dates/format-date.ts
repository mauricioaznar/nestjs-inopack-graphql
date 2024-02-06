import dayjs from 'dayjs';

export function formatDate(date?: string | Date | null) {
    if (!date) {
        return '';
    }
    return dayjs(date).utc().format('YYYY-MM-DD');
}

export function getStringFromDate(date: string, time = '00:00:00') {
    return `${date}T${time}.000Z`;
}
