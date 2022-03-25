import { Module } from '@nestjs/common';
import { MemoryTokenService } from './memory-token.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../../constants/jwt';

@Module({
  imports: [
    MemoryTokenModule,
    JwtModule.register({
      secret: jwtConstants.fileSecret,
      signOptions: { expiresIn: jwtConstants.fileExpiresIn },
    }),
  ],
  providers: [MemoryTokenService],
  exports: [MemoryTokenService],
})
export class MemoryTokenModule {}
