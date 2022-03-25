import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../common/constants/jwt';
import { AuthResolver } from './auth.resolver';
import { MemoryTokenModule } from '../common/services/memory-token/memory-token.module';
import { FilesModule } from '../files/files.module';
import { AuthController } from './auth.controller';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { UserService } from './user.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.authSecret,
      signOptions: { expiresIn: jwtConstants.authExpiresIn },
    }),
    FilesModule,
    MemoryTokenModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    LocalStrategy,
    JwtStrategy,
    AuthResolver,
    PrismaService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
