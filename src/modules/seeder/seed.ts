import { SeederModule } from './seeder.module';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeederService } from './seeder.service';
import dayjs from 'dayjs';
import utcPlugin from 'dayjs/plugin/utc';

dayjs.extend(utcPlugin);

async function bootstrap() {
    NestFactory.createApplicationContext(SeederModule)
        .then((appContext) => {
            const logger = appContext.get(Logger);
            const seeder = appContext.get(SeederService);
            seeder
                .transfersSeed()
                .then(() => {
                    logger.debug('Seeding complete!');
                })
                .catch((error) => {
                    logger.error('Seeding failed!');
                    throw error;
                })
                .finally(() => appContext.close());
        })
        .catch((error) => {
            throw error;
        });
}
void bootstrap();
