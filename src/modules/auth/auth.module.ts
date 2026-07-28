import { Module } from '@nestjs/common';
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

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: jwtConstants.authSecret,
            signOptions: { expiresIn: jwtConstants.authExpiresIn },
        }),
        FilesModule,
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
export class AuthModule {}
