import { Logger, Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { UserService } from '../auth/user.service';
import { PartsService } from '../entities/parts/parts.service';
import { PartCreationModule } from './modules/part-creation/part-creation.module';
import { PartCategoryCreationModule } from './modules/part-category-creation/part-category-creation.module';

@Module({
  providers: [Logger, SeederService, UserService, PrismaService, PartsService],
  imports: [PartCreationModule, PartCategoryCreationModule],
})
export class SeederModule {}
