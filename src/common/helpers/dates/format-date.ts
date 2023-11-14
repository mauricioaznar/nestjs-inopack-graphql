import dayjs from 'dayjs';

export function formatDate(date?: string | Date | null) {
    if (!date) {
        return '';
    }
    return dayjs(date).utc().format('YYYY-MM-DD');
}
