import { Logger, Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { UserService } from '../auth/user.service';

@Module({
  providers: [Logger, SeederService, UserService, PrismaService],
})
export class SeederModule {}
