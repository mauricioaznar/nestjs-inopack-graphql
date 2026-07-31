import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../../common/constants/jwt';
import { AuthResolver } from './auth.resolver';
import { FilesModule } from '../files/files.module';
import { UserService } from './user.service';
import { RoleResolver } from './role.resolver';
import { RoleService } from './role.service';
import { LoggingModule } from '../../common/modules/logging/logging.module';
import { RequestIdMiddleware } from '../../common/modules/logging/request-id.middleware';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: jwtConstants.authSecret,
            signOptions: { expiresIn: jwtConstants.authExpiresIn },
        }),
        FilesModule,
        // Imported explicitly rather than picked up from a global module: this
        // is the first consumer of the logger, and the next one imports it the
        // same deliberate way. `AllowedOriginGuard` and `AuthController` both
        // inject `AppLoggerService`, so this line is what makes them resolvable.
        LoggingModule,
    ],
    // `auth.controller.ts` is back, but only for the httpOnly refresh-cookie
    // endpoints (login / refresh / logout). The legacy `GET /auth/users` route
    // deleted in Phase 0 — it returned every user row including password
    // hashes — is not coming back.
    controllers: [AuthController],
    providers: [
        AuthService,
        UserService,
        // `LocalStrategy` used to sit here. It was registered but never used —
        // nothing ever applied `AuthGuard('local')` — so it was deleted along
        // with its file when this module gained the REST controller.
        JwtStrategy,
        AuthResolver,
        RoleResolver,
        RoleService,
    ],
    exports: [AuthService],
})
export class AuthModule implements NestModule {
    // `auth/*` and nothing else. The correlation id is scoped to the three
    // cookie endpoints because that is the whole of Phase 1.7's scope — GraphQL
    // operations are deliberately not correlated (no `AsyncLocalStorage`), and a
    // request id stamped on routes nothing logs from would be dead weight.
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(RequestIdMiddleware).forRoutes('auth/*');
    }
}
