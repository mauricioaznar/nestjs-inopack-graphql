import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
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
    // No controllers: the legacy REST `POST /auth/login` and `GET /auth/users`
    // were removed (nothing consumed them, and `users` returned every user row
    // including password hashes). Phase 1 reintroduces `auth.controller.ts` for
    // the httpOnly refresh-cookie endpoints.
    providers: [
        AuthService,
        UserService,
        LocalStrategy,
        JwtStrategy,
        AuthResolver,
        RoleResolver,
        RoleService,
    ],
    exports: [AuthService],
})
export class AuthModule {}
