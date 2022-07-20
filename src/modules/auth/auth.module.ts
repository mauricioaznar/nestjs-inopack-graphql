import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../../common/constants/jwt';
import { AuthResolver } from './auth.resolver';
import { FilesModule } from '../files/files.module';
import { AuthController } from './auth.controller';
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
    controllers: [AuthController],
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
