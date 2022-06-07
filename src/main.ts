import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { appConfig } from './common/helpers/app/app-config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    await appConfig({ app });
    await app.listen(3008);
}

void bootstrap();
