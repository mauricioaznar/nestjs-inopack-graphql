import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { appConfig } from './common/helpers/app/app-config';

// CORS was `app.enableCors()` with no arguments until Phase 1, i.e. `Access-
// Control-Allow-Origin: *`. A wildcard is incompatible with credentialed
// requests: the browser refuses to send the refresh cookie unless the API names
// the exact origin *and* allows credentials. So the open door has to become an
// allowlist.
//
// Consequence to keep in mind when deploying: an origin missing from this list
// can no longer talk to the API from a browser. Non-browser callers (scripts,
// server-to-server, curl) are unaffected — CORS is enforced by browsers, not by
// the server.
function corsOrigins(): string[] {
    const configured = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);

    if (configured.length > 0) {
        return configured;
    }

    if (process.env.NODE_ENV === 'production') {
        // Not a boot failure — refusing to start would take a running API down
        // over a missing variable. But the frontend is broken until this is set,
        // so say so loudly in the logs.
        // eslint-disable-next-line no-console
        console.warn(
            'CORS_ORIGINS is not set. Browser requests from the frontend will be ' +
                'rejected and the refresh cookie will not be sent. Set it to the ' +
                'frontend origin(s), comma separated.',
        );
    }

    return ['http://localhost:3000'];
}

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
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
