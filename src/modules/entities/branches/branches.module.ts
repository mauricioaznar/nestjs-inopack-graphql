import { Module } from '@nestjs/common';
import { BranchesResolver } from './branches.resolver';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { BranchesService } from './branches.service';

@Module({
  providers: [PrismaService, BranchesResolver, BranchesService],
  exports: [BranchesResolver],
})
export class BranchesModule {}
