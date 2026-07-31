import { Module } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';
import { RequestIdMiddleware } from './request-id.middleware';

// **Deliberately not `@Global()`**, unlike `PrismaModule` and `PubSubModule`
// beside it. Being imported explicitly is the point: `AuthModule` imports it,
// and the next module that wants logging imports it too — as a decision. A
// global provider invites logging from everywhere without anyone choosing to.
//
// `RequestIdMiddleware` is a provider as well as an export because `AuthModule`
// applies it through `NestModule#configure()`, and Nest resolves middleware
// classes through the DI container of the module that applies them.
@Module({
    providers: [AppLoggerService, RequestIdMiddleware],
    exports: [AppLoggerService, RequestIdMiddleware],
})
export class LoggingModule {}
