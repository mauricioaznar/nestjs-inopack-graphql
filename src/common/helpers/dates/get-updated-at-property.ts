import dayjs from 'dayjs';

export function getUpdatedAtProperty() {
    return {
        updated_at: dayjs().utc().toDate(),
    };
}
