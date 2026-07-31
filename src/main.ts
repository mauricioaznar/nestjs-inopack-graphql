import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { appConfig } from './common/helpers/app/app-config';
import { corsOrigins } from './common/constants/cors';
import { logLevels } from './common/constants/logging';

async function bootstrap() {
    // Resolved before the factory call so the boot banner below can name the
    // threshold. Passing the list to `NestFactory.create` calls
    // `Logger.overrideLogger` internally, so it applies to every `Logger`
    // instance in the process and not just the bootstrap one.
    const levels = logLevels();
    const app = await NestFactory.create(AppModule, { logger: levels });
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

    // The only way to confirm in production that `LOG_LEVEL` actually took
    // effect. Emitted at `log`, so it is invisible at `warn`/`error` — which is
    // correct: someone running at `error` did not ask for a boot banner.
    new Logger('Bootstrap').log(
        `log level ${levels[0]} (enabled: ${levels.join(', ')})`,
    );
}

void bootstrap();
