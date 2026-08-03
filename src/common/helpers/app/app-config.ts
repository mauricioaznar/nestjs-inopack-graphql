import { INestApplication } from '@nestjs/common';

import dayjs from 'dayjs';
import utcPlugin from 'dayjs/plugin/utc';
import timezonePlugin from 'dayjs/plugin/timezone';

export async function appConfig({}: { app: INestApplication }): Promise<void> {
    dayjs.extend(utcPlugin);
    dayjs.extend(timezonePlugin);
}
