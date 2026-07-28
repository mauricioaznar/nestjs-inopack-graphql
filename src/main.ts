import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { appConfig } from './common/helpers/app/app-config';
import { corsOrigins } from './common/constants/cors';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // The allowlist lives in `common/constants/cors` because the auth
    // controller's CSRF guard has to enforce the same list — see the comment
    // there for why the wildcard had to go.
    app.enableCors({
        origin: corsOrigins(),
        // Without this the browser drops the refresh cookie on both the request
        // and the `Set-Cookie` response.
        credentials: true,
    });
    await appConfig({ app });
    await app.listen(3008);
}

void bootstrap();
