import { Module } from '@nestjs/common';
import { PartSubtractionsResolver } from './part-subtractions.resolver';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { PartSubtractionsService } from './part-subtractions.service';

@Module({
  providers: [PrismaService, PartSubtractionsResolver, PartSubtractionsService],
  exports: [PartSubtractionsResolver],
})
export class PartSubtractionsModule {}
