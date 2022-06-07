import { INestApplication } from '@nestjs/common';

import dayjs from 'dayjs';
import utcPlugin from 'dayjs/plugin/utc';

export async function appConfig({}: { app: INestApplication }): Promise<void> {
    dayjs.extend(utcPlugin);
}
