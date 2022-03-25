import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../common/constants/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.fileSecret,
      signOptions: { expiresIn: jwtConstants.fileExpiresIn },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
