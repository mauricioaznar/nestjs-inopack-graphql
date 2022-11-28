import dayjs from 'dayjs';

export function getCreatedAtProperty() {
    return {
        created_at: dayjs().utc().toDate(),
    };
}
